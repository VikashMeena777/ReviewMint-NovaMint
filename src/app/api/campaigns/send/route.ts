// ============================================
// Campaign Send API — Manual / Auto / Email / Both
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { sendTemplateMessage, sanitizeWhatsAppNumber } from '@/lib/whatsapp/client';
import { deductCredits } from '@/lib/wallet/credits';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      channel = 'whatsapp',
      send_mode = 'manual',
      language = 'en',
      review_link,
      connection_id,
      scheduled_for,
      visit_notes,
    } = body;

    if (!customer_name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!review_link) {
      return NextResponse.json({ error: 'Review link is required' }, { status: 400 });
    }
    if ((channel === 'whatsapp' || channel === 'both') && !customer_phone) {
      return NextResponse.json({ error: 'Phone number is required for WhatsApp' }, { status: 400 });
    }
    if ((channel === 'email' || channel === 'both') && !customer_email) {
      return NextResponse.json({ error: 'Email is required for email channel' }, { status: 400 });
    }

    // Get campaign settings for templates
    const { data: settings } = await supabaseAdmin
      .from('campaign_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const templates = (settings as Record<string, unknown>)?.templates as Record<string, Record<string, string>> | undefined;

    // Get business name from profile or connection
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single();
    const businessName = (profile as Record<string, unknown>)?.company_name as string || 'our business';

    // Build message text from template
    const langTemplates = templates?.[language] || templates?.['en'];
    const waTemplate = langTemplates?.whatsapp ||
      (language === 'hi'
        ? 'नमस्ते {name} जी, {business} में आने के लिए धन्यवाद! 🙏\n\nक्या आप हमें Google पर एक review दे सकते हैं?\n\n👉 {review_link}\n\nधन्यवाद!\n- {business}'
        : 'Hi {name}, thank you for visiting {business}! 🙏\n\nCould you take a moment to leave us a Google review?\n\n👉 {review_link}\n\nThank you!\n- {business}');

    const messageText = waTemplate
      .replace(/\{name\}/g, customer_name)
      .replace(/\{business\}/g, businessName)
      .replace(/\{review_link\}/g, review_link);

    // Create the review request record
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      connection_id: connection_id || null,
      customer_name,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      visit_notes: visit_notes || null,
      channel,
      send_mode,
      language,
      message_text: messageText,
      review_link,
      status: scheduled_for ? 'scheduled' : 'pending',
      scheduled_for: scheduled_for || null,
    };

    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from('review_requests')
      .insert(insertData)
      .select('id')
      .single();

    if (insertError || !requestRow) {
      console.error('[Campaign Send] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create review request' }, { status: 500 });
    }

    const requestId = (requestRow as { id: string }).id;

    // If scheduled, don't send now — cron will pick it up
    if (scheduled_for) {
      return NextResponse.json({
        success: true,
        id: requestId,
        status: 'scheduled',
        scheduled_for,
      });
    }

    // ─── MANUAL WhatsApp: generate wa.me link ─────
    if (send_mode === 'manual' && (channel === 'whatsapp' || channel === 'both')) {
      const cleanPhone = sanitizeWhatsAppNumber(customer_phone);
      const encodedMsg = encodeURIComponent(messageText);
      const waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      await supabaseAdmin
        .from('review_requests')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', requestId);

      // For "both" mode, also send email
      if (channel === 'both' && customer_email) {
        await sendEmailReviewRequest(customer_email, customer_name, businessName, review_link, language, langTemplates);
      }

      return NextResponse.json({
        success: true,
        id: requestId,
        mode: 'manual',
        wa_link: waLink,
        status: 'sent',
      });
    }

    // ─── AUTO WhatsApp: send via Meta Cloud API ───
    if (send_mode === 'auto' && (channel === 'whatsapp' || channel === 'both')) {
      // Get WhatsApp connection
      const { data: waConn } = await supabaseAdmin
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!waConn) {
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'failed', failed_reason: 'WhatsApp not connected' })
          .eq('id', requestId);
        return NextResponse.json({ error: 'WhatsApp is not connected. Connect in Settings.' }, { status: 400 });
      }

      const conn = waConn as Record<string, unknown>;

      if (conn.template_status !== 'approved') {
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'failed', failed_reason: 'WhatsApp templates not yet approved by Meta' })
          .eq('id', requestId);
        return NextResponse.json({ error: 'WhatsApp templates are pending approval from Meta (24-48h).' }, { status: 400 });
      }

      // Deduct 1 credit
      const creditResult = await deductCredits(user.id, 1, requestId, `Auto WhatsApp to ${customer_name}`);
      if (!creditResult.success) {
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'failed', failed_reason: creditResult.error || 'Insufficient credits' })
          .eq('id', requestId);
        return NextResponse.json({ error: creditResult.error || 'Insufficient credits' }, { status: 402 });
      }

      // Send template message via Meta Cloud API
      const templateName = language === 'hi' ? 'reviewmint_review_request_hi' : 'reviewmint_review_request_en';
      try {
        const result = await sendTemplateMessage({
          phoneNumberId: conn.phone_number_id as string,
          accessToken: conn.access_token as string,
          to: customer_phone,
          templateName,
          languageCode: language === 'hi' ? 'hi' : 'en',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customer_name },
                { type: 'text', text: businessName },
                { type: 'text', text: review_link },
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

        // Also send email if channel is "both"
        if (channel === 'both' && customer_email) {
          await sendEmailReviewRequest(customer_email, customer_name, businessName, review_link, language, langTemplates);
        }

        return NextResponse.json({
          success: true,
          id: requestId,
          mode: 'auto',
          wa_message_id: result.message_id,
          credits_used: 1,
          new_balance: creditResult.newBalance,
          status: 'sent',
        });
      } catch (err) {
        console.error('[Campaign Send] WhatsApp send failed:', err);
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'failed', failed_reason: (err as Error).message })
          .eq('id', requestId);
        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
      }
    }

    // ─── EMAIL ONLY ─────────────────────────────
    if (channel === 'email' && customer_email) {
      try {
        await sendEmailReviewRequest(customer_email, customer_name, businessName, review_link, language, langTemplates);
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', requestId);

        return NextResponse.json({
          success: true,
          id: requestId,
          mode: send_mode,
          channel: 'email',
          status: 'sent',
        });
      } catch (err) {
        console.error('[Campaign Send] Email send failed:', err);
        await supabaseAdmin
          .from('review_requests')
          .update({ status: 'failed', failed_reason: (err as Error).message })
          .eq('id', requestId);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    }

    // ─── MANUAL EMAIL (wa.me not needed) ────────
    if (send_mode === 'manual' && channel === 'email') {
      return NextResponse.json({ success: true, id: requestId, status: 'pending' });
    }

    return NextResponse.json({ success: true, id: requestId, status: 'pending' });

  } catch (error) {
    console.error('[Campaign Send] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Email Helper ───────────────────────────

async function sendEmailReviewRequest(
  toEmail: string,
  customerName: string,
  businessName: string,
  reviewLink: string,
  language: string,
  templates?: Record<string, string>
) {
  if (!resend) {
    console.error('[Email] Resend not configured');
    return;
  }

  const subject = (templates?.email_subject || (
    language === 'hi'
      ? '{business} में आपका अनुभव कैसा रहा?'
      : 'How was your visit to {business}?'
  ))
    .replace(/\{business\}/g, businessName)
    .replace(/\{name\}/g, customerName);

  const bodyText = (templates?.email_body || (
    language === 'hi'
      ? 'नमस्ते {name} जी,\n\n{business} में आने के लिए धन्यवाद!\n\nकृपया हमें Google पर एक review दें:\n{review_link}\n\nधन्यवाद!\n{business}'
      : 'Hi {name},\n\nThank you for visiting {business}!\n\nWe would appreciate a quick Google review:\n{review_link}\n\nThank you!\n{business}'
  ))
    .replace(/\{name\}/g, customerName)
    .replace(/\{business\}/g, businessName)
    .replace(/\{review_link\}/g, reviewLink);

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:32px">⭐</span>
      </div>
      <div style="font-size:15px;line-height:1.6;color:#1a1a1a;white-space:pre-line">${bodyText}</div>
      <div style="text-align:center;margin-top:28px">
        <a href="${reviewLink}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
          ${language === 'hi' ? 'अभी Review दें ⭐' : 'Leave a Review ⭐'}
        </a>
      </div>
    </div>
    <p style="text-align:center;margin-top:16px;font-size:12px;color:#999">
      Sent via ReviewMint · ${businessName}
    </p>
  </div>
</body>
</html>`;

  const fromEmail = process.env.DEFAULT_FROM_EMAIL || 'noreply@reviewmint.app';

  await resend.emails.send({
    from: `${businessName} <${fromEmail}>`,
    to: toEmail,
    subject,
    html: htmlBody,
  });
}
