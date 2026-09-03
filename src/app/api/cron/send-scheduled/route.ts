// ============================================
// Cron: Send Scheduled Review Requests
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTemplateMessage, sanitizeWhatsAppNumber } from '@/lib/whatsapp/client';
import { deductCredits } from '@/lib/wallet/credits';
import { Resend } from 'resend';

const CRON_SECRET = process.env.CRON_SECRET;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Fetch scheduled requests that are ready to send
    const { data: requests, error } = await supabaseAdmin
      .from('review_requests')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50);

    if (error || !requests?.length) {
      return NextResponse.json({ processed: 0, message: 'No scheduled requests' });
    }

    let sent = 0;
    let failed = 0;

    for (const row of requests) {
      const r = row as Record<string, unknown>;
      const userId = r.user_id as string;
      const requestId = r.id as string;
      const sendMode = r.send_mode as string;
      const channel = r.channel as string;
      const language = r.language as string;

      try {
        // Auto WhatsApp
        if (sendMode === 'auto' && (channel === 'whatsapp' || channel === 'both')) {
          const { data: waConn } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

          if (!waConn || (waConn as Record<string, unknown>).template_status !== 'approved') {
            await supabaseAdmin
              .from('review_requests')
              .update({ status: 'failed', failed_reason: 'WhatsApp not connected or templates not approved' })
              .eq('id', requestId);
            failed++;
            continue;
          }

          const conn = waConn as Record<string, unknown>;

          // Deduct credit
          const creditResult = await deductCredits(userId, 1, requestId, `Scheduled auto send to ${r.customer_name}`);
          if (!creditResult.success) {
            await supabaseAdmin
              .from('review_requests')
              .update({ status: 'failed', failed_reason: creditResult.error || 'Insufficient credits' })
              .eq('id', requestId);
            failed++;
            continue;
          }

          const templateName = language === 'hi' ? 'reviewmint_review_request_hi' : 'reviewmint_review_request_en';

          // Get business name
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('company_name')
            .eq('id', userId)
            .single();
          const businessName = (profile as Record<string, unknown>)?.company_name as string || 'our business';

          const result = await sendTemplateMessage({
            phoneNumberId: conn.phone_number_id as string,
            accessToken: conn.access_token as string,
            to: r.customer_phone as string,
            templateName,
            languageCode: language === 'hi' ? 'hi' : 'en',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: r.customer_name as string },
                  { type: 'text', text: businessName },
                  { type: 'text', text: r.review_link as string },
                ],
              },
            ],
          });

          await supabaseAdmin
            .from('review_requests')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              wa_message_id: result.message_id,
              credits_used: 1,
            })
            .eq('id', requestId);

          sent++;
        }

        // Email
        if ((channel === 'email' || channel === 'both') && r.customer_email && resend) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('company_name')
            .eq('id', userId)
            .single();
          const businessName = (profile as Record<string, unknown>)?.company_name as string || 'our business';

          const subject = language === 'hi'
            ? `${businessName} में आपका अनुभव कैसा रहा?`
            : `How was your visit to ${businessName}?`;

          const fromEmail = process.env.DEFAULT_FROM_EMAIL || 'noreply@reviewmint.app';

          await resend.emails.send({
            from: `${businessName} <${fromEmail}>`,
            to: r.customer_email as string,
            subject,
            html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
              <p style="font-size:15px;line-height:1.6">${(r.message_text as string || '').replace(/\n/g, '<br>')}</p>
              <p style="text-align:center;margin-top:24px">
                <a href="${r.review_link}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
                  ${language === 'hi' ? 'अभी Review दें ⭐' : 'Leave a Review ⭐'}
                </a>
              </p>
            </div>`,
          });

          if (channel === 'email') {
            await supabaseAdmin
              .from('review_requests')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', requestId);
          }
          sent++;
        }

        // Manual mode — just mark as sent (user already opened wa.me link)
        if (sendMode === 'manual') {
          await supabaseAdmin
            .from('review_requests')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', requestId);
          sent++;
        }

        // 1 second delay between sends for rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`[Cron] Failed to send ${requestId}:`, err);
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'failed', failed_reason: (err as Error).message })
          .eq('id', requestId);
        failed++;
      }
    }

    return NextResponse.json({ processed: requests.length, sent, failed });
  } catch (error) {
    console.error('[Cron Send] Error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
