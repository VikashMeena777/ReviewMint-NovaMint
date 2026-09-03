// ============================================
// WhatsApp Webhook — Verification + Delivery Status
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN || 'reviewmint_verify';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// GET: Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  console.error('[WhatsApp Webhook] Verification failed — token mismatch');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Delivery status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Process each entry
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const statuses = change.value?.statuses || [];
        for (const status of statuses) {
          const messageId = status.id;
          const statusValue = status.status; // sent, delivered, read, failed
          const timestamp = status.timestamp;

          if (!messageId) continue;

          const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

          switch (statusValue) {
            case 'sent':
              updates.status = 'sent';
              updates.sent_at = new Date(parseInt(timestamp) * 1000).toISOString();
              break;
            case 'delivered':
              updates.status = 'delivered';
              updates.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
              break;
            case 'read':
              updates.status = 'read';
              updates.read_at = new Date(parseInt(timestamp) * 1000).toISOString();
              break;
            case 'failed':
              updates.status = 'failed';
              updates.failed_reason = status.errors?.[0]?.title || 'Delivery failed';
              break;
            default:
              continue;
          }

          // Update the review_request row by wa_message_id
          const { error } = await supabaseAdmin
            .from('review_requests')
            .update(updates)
            .eq('wa_message_id', messageId);

          if (error) {
            console.error(`[WhatsApp Webhook] Failed to update ${messageId}:`, error);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json({ success: true }, { status: 200 }); // Always 200
  }
}
