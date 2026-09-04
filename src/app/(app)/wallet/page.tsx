"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import {
  Wallet,
  CurrencyInr,
  ArrowDown,
  ArrowUp,
  Plus,
  Lightning,
  Check,
  Tag,
  ShoppingCart,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/helpers";
import type { CreditTransaction } from "@/types";

interface CreditPackage {
  credits: number;
  label: string;
  priceInr: number;
  perCreditPrice: number;
  discount: number;
  popular?: boolean;
}

export default function WalletPage() {
  const params = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [customCredits, setCustomCredits] = useState(10);
  const customPricePerCredit = 1.5;

  // ─── Load Data ────────────────────────────

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, txRes, pkgRes] = await Promise.all([
      supabase.from("profiles").select("wallet_balance, total_credits_purchased, total_credits_used").eq("id", user.id).single(),
      supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      fetch("/api/wallet/purchase").then(r => r.json()),
    ]);

    const p = profileRes.data as Record<string, number> | null;
    setBalance(p?.wallet_balance || 0);
    setTotalPurchased(p?.total_credits_purchased || 0);
    setTotalUsed(p?.total_credits_used || 0);
    setTransactions((txRes.data as CreditTransaction[]) || []);
    setPackages(pkgRes.packages || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle return from payment
  useEffect(() => {
    const orderId = params.get("order_id");
    const credits = params.get("credits");
    if (orderId && credits) {
      verifyPayment(orderId, parseInt(credits));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function verifyPayment(orderId: string, credits: number) {
    try {
      const res = await fetch("/api/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, credits }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`${data.credits_added} credits added to your wallet!`);
        setBalance(data.new_balance);
        loadData();
      } else {
        toast.error(data.error || "Payment verification failed");
      }
    } catch {
      toast.error("Could not verify payment. If you were charged, credits will be added via webhook.");
    }
  }

  // ─── Purchase Credits ─────────────────────

  async function handlePurchase(pkg: CreditPackage) {
    setPurchasing(pkg.credits);
    try {
      const res = await fetch("/api/wallet/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: pkg.credits }),
      });
      const data = await res.json();

      if (!res.ok || !data.payment_session_id) {
        toast.error(data.error || "Failed to create payment");
        return;
      }

      // Open Cashfree checkout
      const cashfreeEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const CashfreeSDK = (window as any).Cashfree;
      if (!CashfreeSDK) {
        toast.error("Payment SDK not loaded. Refresh and try again.");
        return;
      }
      const cashfree = await CashfreeSDK({ mode: cashfreeEnv });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (cashfree as any).checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });
    } catch {
      toast.error("Payment initiation failed.");
    } finally {
      setPurchasing(null);
    }
  }

  // ─── Render ───────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Wallet" description="Manage your credits for auto-sending" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cashfree SDK */}
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />

      <PageHeader title="Wallet" description="Buy credits for auto-sending via WhatsApp Cloud API" />

      {/* Balance Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-accent/25 bg-accent/5 px-5 py-4">
          <div className="flex items-center gap-2 text-accent">
            <Wallet size={18} weight="fill" />
            <span className="text-2xs uppercase tracking-wider font-medium">Balance</span>
          </div>
          <p className="text-3xl font-bold font-mono text-accent mt-2">{balance}</p>
          <p className="text-2xs text-accent/70 mt-1">credits available</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-1/60 px-5 py-4">
          <div className="flex items-center gap-2 text-ink-3">
            <ArrowDown size={18} weight="bold" />
            <span className="text-2xs uppercase tracking-wider font-medium">Purchased</span>
          </div>
          <p className="text-2xl font-semibold font-mono text-ink mt-2">{totalPurchased}</p>
          <p className="text-2xs text-ink-4 mt-1">total credits bought</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-1/60 px-5 py-4">
          <div className="flex items-center gap-2 text-ink-3">
            <ArrowUp size={18} weight="bold" />
            <span className="text-2xs uppercase tracking-wider font-medium">Used</span>
          </div>
          <p className="text-2xl font-semibold font-mono text-ink mt-2">{totalUsed}</p>
          <p className="text-2xs text-ink-4 mt-1">messages sent (auto)</p>
        </div>
      </div>

      {/* Credit Packages */}
      <Panel>
        <PanelHeader title="Buy Credits" description="1 credit = 1 auto WhatsApp message · Dynamic pricing" />
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map(pkg => (
            <div
              key={pkg.credits}
              className={cn(
                "relative rounded-xl border px-4 py-4 transition-all",
                pkg.popular
                  ? "border-accent/40 bg-accent/5 shadow-[0_0_24px_-8px_rgb(44_217_166/0.2)]"
                  : "border-line bg-surface-1/60 hover:border-line-2"
              )}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-2xs px-2.5 py-0.5 rounded-full bg-accent text-accent-ink font-semibold">
                  Popular
                </span>
              )}
              <p className="text-xs font-medium text-ink-3 uppercase tracking-wider">{pkg.label}</p>
              <p className="text-2xl font-bold font-mono text-ink mt-1">{pkg.credits}</p>
              <p className="text-2xs text-ink-4">credits</p>

              <div className="mt-3 pt-3 border-t border-line space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-ink-3">Price</span>
                  <span className="text-lg font-bold text-ink font-mono">₹{pkg.priceInr}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xs text-ink-4">Per credit</span>
                  <span className="text-xs text-ink-3 font-mono">₹{pkg.perCreditPrice.toFixed(2)}</span>
                </div>
                {pkg.discount > 0 && (
                  <div className="flex items-center gap-1 text-accent">
                    <Tag size={12} weight="bold" />
                    <span className="text-2xs font-medium">{Math.round(pkg.discount * 100)}% off</span>
                  </div>
                )}
              </div>

              <Button
                variant={pkg.popular ? "primary" : "secondary"}
                size="sm"
                fullWidth
                className="mt-3"
                onClick={() => handlePurchase(pkg)}
                loading={purchasing === pkg.credits}
                loadingLabel="Processing..."
              >
                <ShoppingCart size={14} weight="bold" />
                Buy {pkg.credits}
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      {/* Custom Credits */}
      <Panel>
        <PanelHeader
          title="Custom Credits"
          description="Buy exactly the amount you need — from 1 to 10,000+"
        />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="custom-credits-input"
              className="text-2xs font-medium text-ink-3 uppercase tracking-wider"
            >
              Number of credits
            </label>
            <input
              id="custom-credits-input"
              type="number"
              min={1}
              max={50000}
              value={customCredits}
              onChange={(e) =>
                setCustomCredits(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent font-mono"
            />
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-2xs text-ink-4">Total price</p>
              <p className="text-2xl font-bold text-ink font-mono">
                ₹{Math.ceil(customCredits * customPricePerCredit)}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                handlePurchase({
                  credits: customCredits,
                  label: "Custom",
                  priceInr: Math.ceil(customCredits * customPricePerCredit),
                  perCreditPrice: customPricePerCredit,
                  discount: 0,
                })
              }
              loading={purchasing === customCredits}
              loadingLabel="Processing..."
            >
              <ShoppingCart size={14} weight="bold" />
              Buy {customCredits} credit{customCredits !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
        <p className="px-4 pb-4 text-2xs text-ink-5">
          ₹{customPricePerCredit.toFixed(2)} per credit · Volume discounts
          available in preset packages above
        </p>
      </Panel>

      {/* How It Works */}
      <div className="rounded-xl border border-line bg-surface-1/60 px-5 py-4">
        <p className="text-xs font-medium text-ink-2 mb-3">How Credits Work</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { icon: Lightning, text: "Manual mode (wa.me link) is always FREE" },
            { icon: CurrencyInr, text: "Auto mode costs 1 credit per WhatsApp message" },
            { icon: Check, text: "Email sending is always FREE (via Resend)" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <item.icon size={15} className="text-accent shrink-0 mt-0.5" weight="fill" />
              <p className="text-2xs text-ink-3 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Panel>
        <PanelHeader title="Transaction History" description="Credits purchased and used" />
        <div className="divide-y divide-line">
          {transactions.length === 0 ? (
            <EmptyState
              icon={<CurrencyInr size={20} />}
              title="No transactions yet"
              description="Buy your first credit pack to get started with auto-sending."
            />
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  "grid size-8 place-items-center rounded-lg shrink-0",
                  tx.type === "purchase" ? "bg-emerald-400/12" :
                  tx.type === "usage" ? "bg-surface-3" :
                  tx.type === "refund" ? "bg-blue-400/12" : "bg-amber-400/12"
                )}>
                  {tx.type === "purchase" ? (
                    <Plus size={14} className="text-emerald-400" weight="bold" />
                  ) : tx.type === "usage" ? (
                    <ArrowUp size={14} className="text-ink-3" weight="bold" />
                  ) : (
                    <ArrowDown size={14} className="text-blue-400" weight="bold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{tx.description || tx.type}</p>
                  <p className="text-2xs text-ink-4 mt-0.5">{timeAgo(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-mono font-medium",
                    tx.amount > 0 ? "text-emerald-400" : "text-ink-3"
                  )}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </p>
                  <p className="text-2xs text-ink-4 font-mono">{tx.balance_after} bal</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
