import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "@/styles/globals.css";

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ReviewMint — AI-Powered Google Review Auto-Responder",
    template: "%s | ReviewMint",
  },
  description:
    "Automatically respond to every Google review with AI-crafted, personalized replies. Manage your online reputation effortlessly. Free 14-day trial.",
  keywords: [
    "Google review auto responder",
    "AI review management",
    "reputation management",
    "Google Business Profile",
    "automated review replies",
  ],
  openGraph: {
    title: "ReviewMint — AI-Powered Google Review Auto-Responder",
    description:
      "Automatically respond to every Google review with AI. Manage your reputation effortlessly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${body.variable} ${mono.variable} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--fg-primary)",
              fontSize: "0.8125rem",
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
