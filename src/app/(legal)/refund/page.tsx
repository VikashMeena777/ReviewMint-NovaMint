import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "ReviewMint refund policy for credit purchases and subscriptions.",
};

export default function RefundPage() {
  return (
    <article className="prose-legal">
      <h1>Refund Policy</h1>
      <p className="lead">
        Last updated: September 4, 2026
      </p>

      <p>
        This Refund Policy applies to all credit purchases made through{" "}
        <strong>ReviewMint</strong>, operated by{" "}
        <strong>NovaMint Networks</strong>.
      </p>

      <h2>1. Credit Purchases</h2>
      <p>
        ReviewMint uses a credit-based system for WhatsApp review request
        messages. Credits are purchased through our secure payment partner,
        Cashfree Payments.
      </p>

      <h2>2. Refund Eligibility</h2>

      <h3>Eligible for Refund</h3>
      <ul>
        <li>
          <strong>Unused credits</strong> — If you purchased credits but have
          not used any of them, you may request a full refund within 7 days of
          purchase.
        </li>
        <li>
          <strong>Technical errors</strong> — If a payment was processed but
          credits were not added to your account due to a technical issue, we
          will either add the credits or issue a full refund.
        </li>
        <li>
          <strong>Duplicate charges</strong> — If you were charged twice for
          the same purchase, the duplicate amount will be refunded in full.
        </li>
      </ul>

      <h3>Not Eligible for Refund</h3>
      <ul>
        <li>
          <strong>Consumed credits</strong> — Credits that have been used to
          send WhatsApp or email messages cannot be refunded, as the message
          delivery cost has already been incurred.
        </li>
        <li>
          <strong>Partially used packages</strong> — If you purchased a credit
          package and used some credits, only the unused portion may be
          eligible for a pro-rated refund at our discretion.
        </li>
        <li>
          <strong>Account termination for policy violation</strong> — If your
          account is terminated due to violation of our Terms of Service,
          remaining credits are forfeited.
        </li>
      </ul>

      <h2>3. How to Request a Refund</h2>
      <ol>
        <li>
          Email{" "}
          <a href="mailto:support.novamintnetworks@gmail.com">
            support.novamintnetworks@gmail.com
          </a>{" "}
          with the subject line &quot;Refund Request&quot;.
        </li>
        <li>
          Include your registered email address and the transaction/order ID
          (found in the Wallet → Transaction History section).
        </li>
        <li>
          Describe the reason for the refund request.
        </li>
      </ol>

      <h2>4. Processing Time</h2>
      <ul>
        <li>
          Refund requests are reviewed within <strong>3 business days</strong>.
        </li>
        <li>
          Approved refunds are processed back to the original payment method
          within <strong>5–10 business days</strong>, depending on your bank.
        </li>
        <li>
          You will receive an email confirmation once the refund is initiated.
        </li>
      </ul>

      <h2>5. Disputes</h2>
      <p>
        If you disagree with a refund decision, you may escalate by replying
        to the refund decision email. We will review your case within 5
        business days.
      </p>

      <h2>6. Contact</h2>
      <p>
        For refund-related queries:
      </p>
      <ul>
        <li>
          <strong>Email</strong>:{" "}
          <a href="mailto:support.novamintnetworks@gmail.com">
            support.novamintnetworks@gmail.com
          </a>
        </li>
        <li>
          <strong>Company</strong>: NovaMint Networks
        </li>
      </ul>
    </article>
  );
}
