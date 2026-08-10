import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "@/styles/globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://reviewmint.app"
  ),
  title: {
    default: "ReviewMint. Every Google review answered, automatically.",
    template: "%s | ReviewMint",
  },
  description:
    "ReviewMint watches your Google Business Profile and replies to every review in your own voice, within minutes. Built for Indian local businesses.",
  keywords: [
    "Google review auto responder",
    "AI review management",
    "reputation management",
    "Google Business Profile",
    "automated review replies",
  ],
  openGraph: {
    title: "ReviewMint. Every Google review answered, automatically.",
    description:
      "Replies to every Google review in your own voice, within minutes. Built for Indian local businesses.",
    type: "website",
    siteName: "ReviewMint",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink"
        >
          Skip to content
        </a>
        {children}
        <Toaster
          position="bottom-right"
          gap={10}
          toastOptions={{
            style: {
              background: "var(--color-surface-3)",
              border: "1px solid var(--color-line-2)",
              borderRadius: "10px",
              color: "var(--color-ink)",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-sans)",
              boxShadow: "var(--shadow-lg)",
            },
          }}
          closeButton
        />
      </body>
    </html>
  );
}
