import Link from "next/link";
import { Wordmark } from "@/components/brand";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/contact", label: "Contact" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-canvas text-ink">
      {/* ── Navbar ──────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Wordmark size={22} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-ink-3 transition-colors hover:text-ink"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-all hover:brightness-110"
            >
              Start free trial
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Content ────────────────────── */}
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
          {children}
        </div>
      </main>

      {/* ── Footer ─────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Wordmark size={20} />
              <p className="mt-2 max-w-[36ch] text-2xs leading-relaxed text-ink-4">
                Every Google review answered, automatically.
                <br />
                A product by NovaMint Networks.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-2xs text-ink-4 transition-colors hover:text-ink-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <p className="text-2xs text-ink-5">
              © {new Date().getFullYear()} NovaMint Networks. All rights reserved.
              ReviewMint is not affiliated with Google. Google Business Profile is a trademark of Google LLC.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
