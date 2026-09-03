// ============================================
// Cashfree Webhook — Credit Payment Confirmation
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { addCredits } from '@/lib/wallet/credits';

const WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

function verifySignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const data = timestamp + rawBody;
  const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(data).digest('base64');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const signature = req.headers.get('x-webhook-signature') || '';

    // Always verify signature — no sandbox bypass
    if (!WEBHOOK_SECRET) {
      console.error('[Cashfree Webhook] CRITICAL: CASHFREE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ message: 'Server misconfigured' }, { status: 200 });
    }

    if (!verifySignature(rawBody, timestamp, signature)) {
      console.error('[Cashfree Webhook] Invalid signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;

    if (eventType !== 'PAYMENT_SUCCESS_WEBHOOK') {
      return NextResponse.json({ message: 'Ignored' }, { status: 200 });
    }

    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;

    if (!orderData?.order_id || !paymentData) {
      return NextResponse.json({ message: 'Missing data' }, { status: 200 });
    }

    const orderId = orderData.order_id as string;
    const paymentAmount = paymentData.payment_amount as number;

    // Extract credits from order note or order_id
    // Order ID format: RM_CR_{user_id_prefix}_{timestamp}
    const orderNote = orderData.order_note as string || '';
    const creditsMatch = orderNote.match(/(\d+)\s*credits/);
    const credits = creditsMatch ? parseInt(creditsMatch[1]) : 0;

    if (!credits) {
      console.error('[Cashfree Webhook] Could not extract credits from order:', orderId);
      return NextResponse.json({ message: 'Could not determine credits' }, { status: 200 });
    }

    // Find user from the order
    // Check if we already processed this order
    const { data: existing } = await supabaseAdmin
      .from('credit_transactions')
      .select('id')
      .eq('cashfree_order_id', orderId)
      .eq('type', 'purchase')
      .maybeSingle();

    if (existing) {
      console.log('[Cashfree Webhook] Order already processed:', orderId);
      return NextResponse.json({ message: 'Already processed' }, { status: 200 });
    }

    // Find user ID from profiles that have an active session with this order
    // We can extract it from the order_id prefix: RM_CR_{user_id_prefix}
    const parts = orderId.split('_');
    const userIdPrefix = parts[2] || '';

    // Search for the user
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('id', `${userIdPrefix}%`)
      .limit(1);

    if (!users?.length) {
      console.error('[Cashfree Webhook] Could not find user for order:', orderId);
      return NextResponse.json({ message: 'User not found' }, { status: 200 });
    }

    const userId = (users[0] as { id: string }).id;

    // Add credits
    const result = await addCredits(userId, credits, orderId, paymentAmount);
    if (result.success) {
      console.log(`[Cashfree Webhook] Added ${credits} credits to user ${userId}`);
    } else {
      console.error('[Cashfree Webhook] Failed to add credits for user:', userId);
    }

    // Always return 200 to prevent retry storms
    return NextResponse.json({ message: 'Processed' }, { status: 200 });
  } catch (err) {
    console.error('[Cashfree Webhook] Error:', err);
    return NextResponse.json({ message: 'Error processed' }, { status: 200 });
  }
}
