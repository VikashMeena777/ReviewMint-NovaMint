import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the ReviewMint team for support, questions, or partnerships.",
};

export default function ContactPage() {
  return (
    <article className="prose-legal">
      <h1>Contact Us</h1>
      <p className="lead">
        We&apos;re here to help. Reach out to us for support, feedback, or
        partnership inquiries.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* ── Support ────────── */}
        <div className="rounded-xl border border-line bg-surface-1/60 p-6 backdrop-blur-sm">
          <div className="mb-3 text-2xl">💬</div>
          <h2 className="!mt-0 text-base font-semibold">General Support</h2>
          <p className="text-sm text-ink-3">
            For questions about using ReviewMint, account issues, or technical
            support.
          </p>
          <a
            href="mailto:support.novamintnetworks@gmail.com"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            support.novamintnetworks@gmail.com
          </a>
        </div>

        {/* ── Billing ────────── */}
        <div className="rounded-xl border border-line bg-surface-1/60 p-6 backdrop-blur-sm">
          <div className="mb-3 text-2xl">💳</div>
          <h2 className="!mt-0 text-base font-semibold">Billing & Refunds</h2>
          <p className="text-sm text-ink-3">
            For payment issues, refund requests, or billing questions.
          </p>
          <a
            href="mailto:support.novamintnetworks@gmail.com?subject=Billing%20Query"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            support.novamintnetworks@gmail.com
          </a>
        </div>

        {/* ── Partnerships ────────── */}
        <div className="rounded-xl border border-line bg-surface-1/60 p-6 backdrop-blur-sm">
          <div className="mb-3 text-2xl">🤝</div>
          <h2 className="!mt-0 text-base font-semibold">Partnerships</h2>
          <p className="text-sm text-ink-3">
            Interested in reselling ReviewMint or integrating with your
            platform? Let&apos;s talk.
          </p>
          <a
            href="mailto:support.novamintnetworks@gmail.com?subject=Partnership%20Inquiry"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            support.novamintnetworks@gmail.com
          </a>
        </div>

        {/* ── Bug Reports ────────── */}
        <div className="rounded-xl border border-line bg-surface-1/60 p-6 backdrop-blur-sm">
          <div className="mb-3 text-2xl">🐛</div>
          <h2 className="!mt-0 text-base font-semibold">Bug Reports</h2>
          <p className="text-sm text-ink-3">
            Found something broken? Help us fix it by sending details about the
            issue.
          </p>
          <a
            href="mailto:support.novamintnetworks@gmail.com?subject=Bug%20Report"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            support.novamintnetworks@gmail.com
          </a>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-line bg-surface-1/60 p-6 backdrop-blur-sm">
        <h2 className="!mt-0 text-base font-semibold">Company Information</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-ink-3">Company</dt>
            <dd className="text-ink">NovaMint Networks</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-3">Email</dt>
            <dd>
              <a
                href="mailto:support.novamintnetworks@gmail.com"
                className="text-accent hover:underline"
              >
                support.novamintnetworks@gmail.com
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink-3">Response Time</dt>
            <dd className="text-ink">
              We typically respond within 24 hours on business days.
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
