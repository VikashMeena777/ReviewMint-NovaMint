"use client";

import { useState } from "react";
import Link from "next/link";
import {
  WhatsappLogo,
  EnvelopeSimple,
  Check,
  Lightning,
  ArrowRight,
} from "@phosphor-icons/react";

const PACKAGES = [
  { credits: 50, label: "Starter", pricePerCredit: 1.5, popular: false },
  { credits: 200, label: "Growth", pricePerCredit: 1.3, popular: true },
  { credits: 500, label: "Business", pricePerCredit: 1.1, popular: false },
  { credits: 1000, label: "Enterprise", pricePerCredit: 0.95, popular: false },
];

const FEATURES = [
  "AI-powered review replies in your voice",
  "Google Business Profile integration",
  "WhatsApp review requests",
  "Email review requests (unlimited, free)",
  "Hindi + English templates",
  "CSV bulk import (up to 500 rows)",
  "Manual WhatsApp via wa.me links (free)",
  "Real-time review analytics dashboard",
];

export default function PricingPage() {
  const [customCredits, setCustomCredits] = useState<number>(10);
  const customPricePerCredit = 1.5; // Base rate for custom
  const customTotal = Math.ceil(customCredits * customPricePerCredit);

  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Simple, flexible pricing
        </h1>
        <p className="mt-4 text-lg text-ink-3">
          Auto-replies are free. Only pay for WhatsApp review requests.
          <br />
          Email requests are always free.
        </p>
      </div>

      {/* ── Free Tier ───────────── */}
      <div className="mt-14 rounded-2xl border border-line bg-surface-1/60 p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Free Forever
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-ink">
          Auto Review Replies
        </h2>
        <p className="mt-2 text-sm text-ink-3">
          Connect your Google Business Profile and ReviewMint automatically
          replies to every new review in your brand voice. No limits, no cost.
        </p>
        <ul className="mt-6 space-y-2.5">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check
                size={16}
                weight="bold"
                className="mt-0.5 shrink-0 text-accent"
              />
              <span className="text-ink-2">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Credit Packages ───────────── */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-ink">
          WhatsApp Credit Packages
        </h2>
        <p className="mt-2 text-center text-sm text-ink-3">
          1 credit = 1 WhatsApp review request message. Prices include Meta&apos;s
          delivery fee + our service fee.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.credits}
              className={`relative rounded-xl border p-6 transition-all hover:border-accent/50 ${
                pkg.popular
                  ? "border-accent bg-accent/5"
                  : "border-line bg-surface-1/60"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-2xs font-semibold text-accent-ink">
                  Most Popular
                </span>
              )}
              <h3 className="text-sm font-medium text-ink-3">{pkg.label}</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold text-ink">
                  ₹{Math.ceil(pkg.credits * pkg.pricePerCredit)}
                </span>
              </div>
              <p className="mt-1 text-2xs text-ink-4">
                {pkg.credits} credits · ₹{pkg.pricePerCredit.toFixed(2)}/msg
              </p>
              <Link
                href="/signup"
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition-all hover:brightness-110"
              >
                Get started
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Custom Credits ───────────── */}
      <div className="mt-12 rounded-2xl border border-line bg-surface-1/60 p-8 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Lightning size={20} weight="fill" className="text-accent" />
          <h2 className="text-lg font-semibold text-ink">
            Buy Custom Credits
          </h2>
        </div>
        <p className="mt-2 text-sm text-ink-3">
          Need a specific amount? Buy exactly the credits you need — from 1 to
          10,000+.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="custom-credits"
              className="text-xs font-medium text-ink-3"
            >
              Number of credits
            </label>
            <input
              id="custom-credits"
              type="number"
              min={1}
              max={50000}
              value={customCredits}
              onChange={(e) =>
                setCustomCredits(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-2xs text-ink-4">Total</p>
              <p className="text-2xl font-bold text-ink">₹{customTotal}</p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition-all hover:brightness-110"
            >
              Buy credits
            </Link>
          </div>
        </div>
        <p className="mt-3 text-2xs text-ink-5">
          ₹{customPricePerCredit.toFixed(2)} per credit · Volume discounts
          available in preset packages above
        </p>
      </div>

      {/* ── Channel Comparison ───────────── */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-ink">
          Channel Comparison
        </h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-3 text-left font-medium text-ink-3">
                  Feature
                </th>
                <th className="pb-3 text-center font-medium text-ink-3">
                  <WhatsappLogo
                    size={18}
                    weight="fill"
                    className="mx-auto mb-1 text-[#25d366]"
                  />
                  WhatsApp
                </th>
                <th className="pb-3 text-center font-medium text-ink-3">
                  <EnvelopeSimple
                    size={18}
                    className="mx-auto mb-1 text-blue-400"
                  />
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              <tr>
                <td className="py-3 text-ink-2">Cost</td>
                <td className="py-3 text-center text-ink-2">Credits-based</td>
                <td className="py-3 text-center text-accent font-medium">
                  Free
                </td>
              </tr>
              <tr>
                <td className="py-3 text-ink-2">Open rate</td>
                <td className="py-3 text-center text-accent font-medium">
                  ~98%
                </td>
                <td className="py-3 text-center text-ink-2">~20-30%</td>
              </tr>
              <tr>
                <td className="py-3 text-ink-2">Review conversion</td>
                <td className="py-3 text-center text-accent font-medium">
                  High
                </td>
                <td className="py-3 text-center text-ink-2">Medium</td>
              </tr>
              <tr>
                <td className="py-3 text-ink-2">Requires setup</td>
                <td className="py-3 text-center text-ink-2">
                  WhatsApp Business connect
                </td>
                <td className="py-3 text-center text-ink-2">Email only</td>
              </tr>
              <tr>
                <td className="py-3 text-ink-2">Languages</td>
                <td className="py-3 text-center text-ink-2">
                  Hindi + English
                </td>
                <td className="py-3 text-center text-ink-2">
                  Hindi + English
                </td>
              </tr>
              <tr>
                <td className="py-3 text-ink-2">Manual sending</td>
                <td className="py-3 text-center text-accent font-medium">
                  Free (wa.me links)
                </td>
                <td className="py-3 text-center text-ink-2">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ───────────── */}
      <div className="mt-16 space-y-6">
        <h2 className="text-center text-2xl font-semibold text-ink">
          Pricing FAQ
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Is the auto-reply feature really free?",
              a: "Yes. AI-powered review replies to your Google reviews are completely free with no limits. You only pay for WhatsApp review request messages.",
            },
            {
              q: "Why do WhatsApp messages cost credits?",
              a: "Meta charges a per-message fee for WhatsApp Business API messages. Our credit price includes Meta's fee plus a small service fee.",
            },
            {
              q: "Do credits expire?",
              a: "No. Credits remain in your wallet as long as your account is active.",
            },
            {
              q: "Can I get a refund?",
              a: "Unused credits can be refunded within 7 days. Consumed credits are non-refundable. See our Refund Policy for details.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-line bg-surface-1/60 backdrop-blur-sm"
            >
              <summary className="cursor-pointer select-none px-6 py-4 text-sm font-medium text-ink transition-colors hover:text-accent">
                {item.q}
              </summary>
              <p className="px-6 pb-4 text-sm leading-relaxed text-ink-3">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* ── CTA ───────────── */}
      <div className="mt-16 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-ink transition-all hover:brightness-110"
        >
          Start free trial
          <ArrowRight size={16} />
        </Link>
        <p className="mt-3 text-2xs text-ink-4">
          No credit card required · Free auto-replies forever
        </p>
      </div>
    </div>
  );
}
