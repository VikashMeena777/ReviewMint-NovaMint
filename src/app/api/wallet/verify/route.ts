// ============================================
// Wallet Verify — Verify Cashfree Payment + Add Credits
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { addCredits } from '@/lib/wallet/credits';

const CASHFREE_API_URL = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id, credits } = await req.json();
    if (!order_id || !credits) {
      return NextResponse.json({ error: 'order_id and credits are required' }, { status: 400 });
    }

    // Verify payment with Cashfree via REST API
    const response = await fetch(`${CASHFREE_API_URL}/orders/${order_id}/payments`, {
      headers: {
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || '',
      },
    });

    const payments = await response.json();

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'No payments found for this order' }, { status: 400 });
    }

    const successPayment = payments.find(
      (p: Record<string, unknown>) => p.payment_status === 'SUCCESS'
    );

    if (!successPayment) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const paymentAmount = (successPayment as Record<string, unknown>).payment_amount as number;

    // Add credits to wallet
    const result = await addCredits(user.id, credits, order_id, paymentAmount);
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credits_added: credits,
      new_balance: result.newBalance,
      payment_amount: paymentAmount,
    });
  } catch (error) {
    console.error('[Wallet Verify] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
