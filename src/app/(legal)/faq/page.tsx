import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about ReviewMint — automated Google review replies and review request campaigns.",
};

const FAQ_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is ReviewMint?",
        a: "ReviewMint is an automated Google review management platform. It reads new reviews on your Google Business Profile and posts AI-generated replies in your brand voice — usually within the hour. It also helps you collect more reviews by sending review requests to your customers via WhatsApp and email.",
      },
      {
        q: "How do I get started?",
        a: "Sign up for a free account, connect your Google Business Profile (takes about 1 minute), describe your business tone, and ReviewMint starts handling reviews automatically. No credit card required.",
      },
      {
        q: "Is ReviewMint only for doctors and hospitals?",
        a: "No! ReviewMint works for any business with a Google Business Profile — restaurants, salons, gyms, retail stores, clinics, hotels, coaching centers, and more. Any business that gets Google reviews can benefit.",
      },
      {
        q: "Does it work for businesses in India?",
        a: "Yes, ReviewMint is built specifically for Indian businesses. It supports Hindi and English review replies and review requests, and accepts payments via UPI, cards, and netbanking through Cashfree.",
      },
    ],
  },
  {
    title: "Auto Review Replies",
    items: [
      {
        q: "How does the AI reply feature work?",
        a: "When a new review appears on your Google Business Profile, ReviewMint reads it, understands the sentiment (positive, negative, neutral), and generates a reply using your configured tone, business details, and any special instructions. The reply is posted after a configurable delay.",
      },
      {
        q: "Can I control what the AI says?",
        a: "Absolutely. You set the tone (professional, friendly, warm), describe your business, and add specific instructions (e.g., 'never offer discounts', 'always mention our free parking'). The AI follows these guidelines for every reply.",
      },
      {
        q: "What if I don't like a reply?",
        a: "You can review and edit any reply before it's posted by adjusting the reply delay. You can also delete a posted reply directly from Google.",
      },
      {
        q: "Is the auto-reply feature free?",
        a: "Yes, completely free with no limits. Auto-replies to Google reviews are the core of ReviewMint and will always be free.",
      },
    ],
  },
  {
    title: "Review Requests",
    items: [
      {
        q: "What are review request campaigns?",
        a: "Campaigns let you send messages to your customers asking them to leave a Google review. You can send them via WhatsApp (automated or manual) or email. Each message includes a direct link to your Google review page.",
      },
      {
        q: "What's the difference between manual and auto WhatsApp?",
        a: "Manual sending opens a wa.me link that you send yourself — it's completely free and requires no setup. Auto sending uses the WhatsApp Cloud API to send messages automatically from your WhatsApp Business number — this requires connecting your WhatsApp account and costs credits.",
      },
      {
        q: "Are email review requests free?",
        a: "Yes. Email review requests are sent through our email system at no cost to you.",
      },
      {
        q: "Can I send review requests in Hindi?",
        a: "Yes. Both WhatsApp and email templates are available in Hindi and English. You choose the language when sending.",
      },
    ],
  },
  {
    title: "WhatsApp Setup",
    items: [
      {
        q: "How do I connect WhatsApp?",
        a: "Go to Connections → Click 'Connect WhatsApp' → Complete the Meta Embedded Signup (about 2 minutes). This connects your own WhatsApp Business number to send messages professionally.",
      },
      {
        q: "Do messages come from my own number?",
        a: "Yes. Messages are sent from your own WhatsApp Business number, not from ReviewMint's number. This looks professional and builds trust with your customers.",
      },
      {
        q: "What are WhatsApp templates and why do they need approval?",
        a: "WhatsApp requires all business-initiated messages to use pre-approved templates. ReviewMint automatically submits review request templates when you connect. Meta typically approves them within 24-48 hours.",
      },
      {
        q: "What if my templates get rejected?",
        a: "This is rare, but if it happens, you can still use manual WhatsApp (wa.me links) and email. Contact support and we'll help you resubmit templates.",
      },
    ],
  },
  {
    title: "Credits & Billing",
    items: [
      {
        q: "What are credits?",
        a: "Credits are used to send WhatsApp review requests via the Cloud API. 1 credit = 1 WhatsApp message. You can buy preset packages or any custom amount.",
      },
      {
        q: "How much does each credit cost?",
        a: "Prices range from ₹0.95 to ₹1.50 per credit depending on the package size. Custom purchases are at ₹1.50/credit. Volume packages offer better rates.",
      },
      {
        q: "Do credits expire?",
        a: "No. Credits remain in your wallet as long as your account is active.",
      },
      {
        q: "Can I get a refund?",
        a: "Unused credits can be refunded within 7 days of purchase. Consumed credits (messages already sent) cannot be refunded. See our Refund Policy for full details.",
      },
      {
        q: "Why are credit prices dynamic?",
        a: "Meta charges a per-message fee for the WhatsApp Business API that can change over time. Our credit prices include Meta's fee plus a service fee, so they adjust accordingly.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        q: "Is my data safe?",
        a: "Yes. We use HTTPS encryption, Row-Level Security on all database tables, HSTS headers, and encrypted token storage. We never share your business data with third parties for marketing.",
      },
      {
        q: "Can I disconnect my accounts?",
        a: "Yes. You can disconnect Google or WhatsApp at any time from the Connections page. Disconnecting stops all automated activity immediately.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Contact support to request account deletion. All data is removed within 30 days. Previously posted Google replies remain on Google.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-ink-3">
          Everything you need to know about ReviewMint.
        </p>
      </div>

      <div className="mt-14 space-y-12">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-4 text-lg font-semibold text-ink">
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-line bg-surface-1/60 backdrop-blur-sm transition-colors hover:border-line-2"
                >
                  <summary className="cursor-pointer select-none px-5 py-4 text-sm font-medium text-ink transition-colors group-open:text-accent">
                    {item.q}
                  </summary>
                  <p className="border-t border-line/50 px-5 py-4 text-sm leading-relaxed text-ink-3">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
