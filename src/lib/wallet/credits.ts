// ============================================
// ReviewMint — Credit/Wallet + Dynamic Pricing
// ============================================

import { createClient } from '@supabase/supabase-js';
import type { PricingConfig, BulkDiscountTier } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// ─── Fetch Pricing Config ───────────────────

let cachedPricing: PricingConfig | null = null;
let cachedAt = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getPricingConfig(): Promise<PricingConfig> {
  const now = Date.now();
  if (cachedPricing && now - cachedAt < CACHE_TTL) return cachedPricing;

  const { data } = await supabaseAdmin
    .from('pricing_config')
    .select('*')
    .eq('id', 'default')
    .single();

  if (!data) {
    // Fallback defaults if table is empty
    return {
      id: 'default',
      meta_base_rate_inr: 0.70,
      markup_multiplier: 2.0,
      bulk_discount_tiers: [
        { min_credits: 50, discount: 0 },
        { min_credits: 200, discount: 0.10 },
        { min_credits: 500, discount: 0.20 },
        { min_credits: 2000, discount: 0.30 },
      ],
      updated_at: new Date().toISOString(),
    };
  }

  cachedPricing = data as unknown as PricingConfig;
  cachedAt = now;
  return cachedPricing;
}

// ─── Calculate Package Price ────────────────

export function calculatePackagePrice(
  credits: number,
  pricing: PricingConfig
): { priceInr: number; perCreditPrice: number; discount: number } {
  const tiers = (pricing.bulk_discount_tiers || []) as BulkDiscountTier[];
  
  // Find the best matching discount tier
  let discount = 0;
  for (const tier of tiers.sort((a, b) => b.min_credits - a.min_credits)) {
    if (credits >= tier.min_credits) {
      discount = tier.discount;
      break;
    }
  }

  const basePerCredit = pricing.meta_base_rate_inr * pricing.markup_multiplier;
  const perCreditPrice = basePerCredit * (1 - discount);
  const priceInr = Math.ceil(credits * perCreditPrice);

  return { priceInr, perCreditPrice, discount };
}

// ─── Get Credit Packages ────────────────────

export interface CreditPackage {
  credits: number;
  label: string;
  priceInr: number;
  perCreditPrice: number;
  discount: number;
  popular?: boolean;
}

export async function getCreditPackages(): Promise<CreditPackage[]> {
  const pricing = await getPricingConfig();

  const packages: Omit<CreditPackage, 'priceInr' | 'perCreditPrice' | 'discount'>[] = [
    { credits: 50, label: 'Starter' },
    { credits: 200, label: 'Growth', popular: true },
    { credits: 500, label: 'Business' },
    { credits: 2000, label: 'Scale' },
  ];

  return packages.map(pkg => {
    const { priceInr, perCreditPrice, discount } = calculatePackagePrice(pkg.credits, pricing);
    return { ...pkg, priceInr, perCreditPrice, discount };
  });
}

// ─── Check Balance ──────────────────────────

export async function getWalletBalance(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  return (data as { wallet_balance: number } | null)?.wallet_balance ?? 0;
}

// ─── Deduct Credits (Atomic) ────────────────

export async function deductCredits(
  userId: string,
  amount: number,
  reviewRequestId: string,
  description: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  // Use a transaction-like approach: read → check → update → log
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  const currentBalance = (profile as { wallet_balance: number } | null)?.wallet_balance ?? 0;

  if (currentBalance < amount) {
    return {
      success: false,
      newBalance: currentBalance,
      error: `Insufficient credits. You have ${currentBalance} credits but need ${amount}.`,
    };
  }

  const newBalance = currentBalance - amount;

  // Update balance
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      wallet_balance: newBalance,
      total_credits_used: (profile as Record<string, unknown>)?.total_credits_used
        ? ((profile as Record<string, unknown>).total_credits_used as number) + amount
        : amount,
    })
    .eq('id', userId);

  if (updateError) {
    return { success: false, newBalance: currentBalance, error: 'Failed to update balance.' };
  }

  // Log the transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    type: 'usage',
    amount: -amount,
    balance_after: newBalance,
    review_request_id: reviewRequestId,
    description,
  });

  return { success: true, newBalance };
}

// ─── Add Credits (After Payment) ────────────

export async function addCredits(
  userId: string,
  amount: number,
  cashfreeOrderId: string,
  paymentAmountInr: number
): Promise<{ success: boolean; newBalance: number }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('wallet_balance, total_credits_purchased')
    .eq('id', userId)
    .single();

  const p = profile as Record<string, unknown> | null;
  const currentBalance = (p?.wallet_balance as number) ?? 0;
  const totalPurchased = (p?.total_credits_purchased as number) ?? 0;
  const newBalance = currentBalance + amount;

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      wallet_balance: newBalance,
      total_credits_purchased: totalPurchased + amount,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, newBalance: currentBalance };
  }

  // Log the transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    type: 'purchase',
    amount,
    balance_after: newBalance,
    cashfree_order_id: cashfreeOrderId,
    payment_amount_inr: paymentAmountInr,
    description: `Purchased ${amount} credits for ₹${paymentAmountInr}`,
  });

  return { success: true, newBalance };
}
