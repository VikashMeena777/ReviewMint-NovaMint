import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ReviewMint collects, uses, and protects your data. Last updated September 2026.",
};

export default function PrivacyPage() {
  return (
    <article className="prose-legal">
      <h1>Privacy Policy</h1>
      <p className="lead">
        Last updated: September 4, 2026
      </p>

      <p>
        This Privacy Policy describes how <strong>NovaMint Networks</strong>{" "}
        (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, and
        protects information when you use <strong>ReviewMint</strong>{" "}
        (&quot;the Service&quot;), accessible at{" "}
        <a href="https://reviewmint.novamintnetworks.in">
          reviewmint.novamintnetworks.in
        </a>
        .
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Account Information</h3>
      <p>
        When you sign up, we collect your email address and name through Google
        OAuth or email/password registration. We do not store your Google
        password.
      </p>

      <h3>1.2 Business Data</h3>
      <ul>
        <li>
          <strong>Google Business Profile data</strong> — Business name,
          location address, reviews, star ratings, and reviewer names. Accessed
          via the Google Business Profile API with your explicit consent.
        </li>
        <li>
          <strong>Customer contact data</strong> — Phone numbers and email
          addresses you provide for review request campaigns. We do not
          independently collect this data; you input it.
        </li>
      </ul>

      <h3>1.3 WhatsApp Business Data</h3>
      <p>
        When you connect your WhatsApp Business account via Meta&apos;s Embedded
        Signup, we store your WhatsApp Business Account ID, phone number ID,
        display phone number, and an access token. Message content is processed
        transiently to send review requests and is not stored by ReviewMint
        beyond delivery status tracking.
      </p>

      <h3>1.4 Payment Data</h3>
      <p>
        We do not process or store credit/debit card details. All payment
        processing is handled by <strong>Cashfree Payments</strong>, a
        PCI-DSS compliant payment gateway. We only store transaction IDs and
        credit amounts.
      </p>

      <h3>1.5 Usage Data</h3>
      <p>
        We collect anonymized usage analytics (pages visited, features used) to
        improve the Service. We do not track you across other websites.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and operate the ReviewMint service</li>
        <li>
          To read your Google reviews and generate AI-powered replies in your
          brand voice
        </li>
        <li>
          To send review request messages via WhatsApp and email on your behalf
        </li>
        <li>To process credit purchases and maintain your wallet balance</li>
        <li>To communicate service updates, billing, and support</li>
        <li>To detect and prevent fraud or abuse</li>
      </ul>

      <h2>3. Third-Party Services</h2>
      <p>We integrate with the following third-party services:</p>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Purpose</th>
            <th>Data Shared</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Google Business Profile API</td>
            <td>Read reviews, post replies</td>
            <td>Business location data, reviews</td>
          </tr>
          <tr>
            <td>Meta WhatsApp Cloud API</td>
            <td>Send review request messages</td>
            <td>Customer phone numbers, message templates</td>
          </tr>
          <tr>
            <td>Supabase</td>
            <td>Database and authentication</td>
            <td>Account data, encrypted at rest</td>
          </tr>
          <tr>
            <td>Cashfree Payments</td>
            <td>Payment processing</td>
            <td>Transaction details (no card data)</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Transactional emails</td>
            <td>Email addresses, email content</td>
          </tr>
          <tr>
            <td>Groq / Google Gemini</td>
            <td>AI-generated review replies</td>
            <td>Review text (anonymized, no PII)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. Review data
        is synced from Google and cached for display purposes. You can delete
        your account at any time, which will remove all stored data within 30
        days.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We implement industry-standard security measures including:
      </p>
      <ul>
        <li>HTTPS encryption for all data in transit</li>
        <li>Row-Level Security (RLS) on all database tables</li>
        <li>Encrypted storage of API tokens and credentials</li>
        <li>HSTS headers enforced on all pages</li>
        <li>Webhook signature verification for all inbound integrations</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> — Request a copy of all data we hold about you
        </li>
        <li>
          <strong>Correct</strong> — Update inaccurate personal information
        </li>
        <li>
          <strong>Delete</strong> — Request deletion of your account and all
          associated data
        </li>
        <li>
          <strong>Revoke</strong> — Disconnect Google or WhatsApp at any time
          from the Connections page
        </li>
        <li>
          <strong>Object</strong> — Opt out of non-essential communications
        </li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        ReviewMint uses essential cookies only — session cookies for
        authentication and CSRF protection. We do not use advertising or
        third-party tracking cookies.
      </p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        ReviewMint is a business tool and is not intended for use by individuals
        under 18 years of age. We do not knowingly collect data from minors.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes
        will be communicated via email or a notice on the Service. Your
        continued use after changes constitutes acceptance.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        For privacy-related inquiries, data requests, or complaints:
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
