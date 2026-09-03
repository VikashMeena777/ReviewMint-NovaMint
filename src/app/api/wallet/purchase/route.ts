// ============================================
// Wallet Purchase — Create Cashfree Order for Credits
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getCreditPackages, calculatePackagePrice, getPricingConfig } from '@/lib/wallet/credits';

const CASHFREE_API_URL = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';

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

export async function GET() {
  try {
    const packages = await getCreditPackages();
    return NextResponse.json({ packages });
  } catch {
    return NextResponse.json({ error: 'Failed to load packages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { credits } = await req.json();
    if (!credits || credits < 50) {
      return NextResponse.json({ error: 'Minimum 50 credits required' }, { status: 400 });
    }

    const pricing = await getPricingConfig();
    const { priceInr } = calculatePackagePrice(credits, pricing);

    const orderId = `RM_CR_${user.id.substring(0, 8)}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${CASHFREE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || '',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: priceInr,
        order_currency: 'INR',
        customer_details: {
          customer_id: user.id.substring(0, 25),
          customer_email: user.email || 'customer@reviewmint.app',
          customer_phone: '9999999999',
        },
        order_meta: {
          return_url: `${appUrl}/wallet?order_id=${orderId}&credits=${credits}`,
          notify_url: `${appUrl}/api/webhooks/cashfree/credits`,
        },
        order_note: `ReviewMint: ${credits} credits purchase`,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.payment_session_id) {
      console.error('[Wallet] Cashfree order creation failed:', result);
      return NextResponse.json({ error: result.message || 'Failed to create payment session' }, { status: 500 });
    }

    return NextResponse.json({
      order_id: orderId,
      payment_session_id: result.payment_session_id,
      amount: priceInr,
      credits,
    });
  } catch (error) {
    console.error('[Wallet] Purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
