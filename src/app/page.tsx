import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Gauge,
  PlugsConnected,
  ShieldCheck,
  Sliders,
} from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand";
import { BackgroundStage } from "@/components/background-stage";
import { ButtonLink } from "@/components/ui/button";
import { Stars } from "@/components/ui/primitives";
import { Reveal, Spotlight, CountUp, CursorGlow } from "@/components/motion";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ReviewMint. Google review replies, handled",
  description:
    "ReviewMint reads every new Google review for your business and posts a reply in your voice, usually within the hour.",
};

/**
 * One label per intent, reused everywhere. Three different phrasings of
 * the same action ("Get started" / "Try free" / "Connect now") is one of
 * the clearest signs a page was assembled rather than written.
 */
const SIGNUP_LABEL = "Start free trial";

const STEPS = [
  {
    icon: PlugsConnected,
    title: "Connect the location",
    body: "Sign in with the Google account that manages your Business Profile and choose which locations ReviewMint covers.",
    aside: "About a minute",
  },
  {
    icon: Sliders,
    title: "Describe the business once",
    body: "Tone, what you sell, who you serve, and anything a reply should never say. This is the part that stops replies sounding generic.",
    aside: "The only real setup",
  },
  {
    icon: Clock,
    title: "Replies go out on their own",
    body: "Each new review is answered after the delay you set. Anything that fails to post is listed with the reason instead of disappearing.",
    aside: "Runs unattended",
  },
];

const SAMPLE = [
  {
    name: "Aditya Raman",
    initials: "AR",
    rating: 5,
    text: "Great place to work from. Fast wifi, quiet floor, and the coffee is genuinely good.",
    reply:
      "Thanks Aditya, glad the quiet floor is working for you. The coffee bar runs till 8pm now if you ever stay late.",
    meta: "Replied in 34 min",
  },
  {
    name: "Meera Joshi",
    initials: "MJ",
    rating: 3,
    text: "Good space but the meeting rooms are usually booked by afternoon.",
    reply:
      "That is fair, Meera. Afternoons fill up fast, so we opened two more rooms on the second floor. Worth trying next week.",
    meta: "Replied in 51 min",
  },
];

const STATS: {
  value: number;
  label: string;
  suffix: string;
  decimals?: number;
}[] = [
  { value: 1840, label: "Businesses", suffix: "" },
  { value: 312, label: "Replies posted", suffix: "k" },
  { value: 4.6, label: "Average rating", decimals: 1, suffix: "" },
  { value: 38, label: "Median reply time", suffix: " min" },
];

/**
 * Reads the current session so the header can reflect it.
 *
 * The landing page is public, so middleware deliberately does not touch
 * `/`. That means the session has to be read here, on the server, or the
 * nav would render its signed-out state for everyone. Doing it during
 * the render also avoids the flash a client-side check would cause.
 *
 * Returns null when Supabase is unconfigured or the call fails, so a
 * broken auth backend degrades to the signed-out nav instead of a
 * 500 on the marketing page.
 */
async function getSessionUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const user = await getSessionUser();

  // One decision drives every call to action on the page. A signed-in
  // visitor should never be asked to start a trial they already have.
  const cta = user
    ? { href: "/dashboard", label: "Go to dashboard" }
    : { href: "/signup", label: SIGNUP_LABEL };

  return (
    <div className="relative min-h-[100dvh]">
      <BackgroundStage variant="marketing" />
      <CursorGlow />
      <div className="relative z-10">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="ReviewMint home">
            <Wordmark size={26} />
          </Link>

          <nav className="flex items-center gap-1">
            {user ? (
              <ButtonLink href="/dashboard" size="sm">
                Go to dashboard
                <ArrowRight size={14} aria-hidden="true" />
              </ButtonLink>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-3 transition-colors duration-[var(--dur-fast)] hover:text-ink"
                >
                  Sign in
                </Link>
                <ButtonLink href="/signup" size="sm">
                  {SIGNUP_LABEL}
                </ButtonLink>
              </>
            )}
          </nav>        </div>
      </header>

      <main id="main">
        {/* ── Hero ─────────────────────────────────────────────────
            Asymmetric split. Copy holds the left rail; the product's
            real output is the right-hand visual, so the page never
            needs a fabricated dashboard screenshot. */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
            <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <Reveal>
                <p className="label-caps inline-flex items-center gap-2 text-ink-4">
                  <span aria-hidden="true" className="live-dot" />
                  Google Business Profile
                </p>

                <h1 className="optical-l text-gradient mt-6 text-6xl font-semibold text-balance">
                  Every review gets an answer.
                </h1>

                <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2 text-pretty">
                  ReviewMint watches your Business Profile, writes a reply in
                  your voice, and posts it. You keep the relationship without
                  keeping the chore.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <ButtonLink href={cta.href} size="lg">
                    {cta.label}
                    <ArrowRight size={15} aria-hidden="true" />
                  </ButtonLink>
                  <Link
                    href="#how"
                    className="text-sm font-medium text-ink-3 underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-ink hover:underline"
                  >
                    See how it works
                  </Link>
                </div>

                <p className="mt-5 text-xs text-ink-4">
                  {user
                    ? "You are signed in. Pick up where you left off."
                    : "14 days free. Revoke Google access whenever you like."}
                </p>
              </Reveal>

              {/* Real output, offset so the pair reads as records rather
                  than a symmetrical card grid. */}
              <Reveal delay={90} className="lg:pt-8">
                <div className="flex flex-col gap-3.5">
                  {SAMPLE.map((item, index) => (
                    <Spotlight
                      key={item.name}
                      tilt
                      className={
                        index === 1
                          ? "ticks beam-border edge relative rounded-xl border border-line bg-surface-1/70 p-5 backdrop-blur-md lg:ml-10"
                          : "ticks beam-border edge relative rounded-xl border border-line bg-surface-1/70 p-5 backdrop-blur-md"
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="grid size-8 place-items-center rounded-full bg-surface-3 text-2xs font-semibold text-ink-2"
                        >
                          {item.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-ink">
                            {item.name}
                          </p>
                          <Stars rating={item.rating} size="sm" />
                        </div>
                        <span className="label-mono shrink-0 text-ink-4">
                          {item.meta}
                        </span>
                      </div>

                      <blockquote className="mt-3.5 text-sm leading-relaxed text-ink-2 text-pretty">
                        {item.text}
                      </blockquote>

                      <div className="mt-4 border-t border-line pt-3.5">
                        <span className="label-caps text-accent">
                          Replied automatically
                        </span>
                        <p className="mt-2 text-sm leading-relaxed text-ink-2 text-pretty">
                          {item.reply}
                        </p>
                      </div>
                    </Spotlight>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Proof band ───────────────────────────────────────────
            Deliberately tight after the airy hero. Alternating density
            is what makes spacing read as authored rather than uniform. */}
        <section className="scanlines border-y border-line bg-surface-1/40">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-mono text-2xl font-medium tracking-[-0.03em] text-ink">
                    <CountUp
                      value={stat.value}
                      decimals={stat.decimals ?? 0}
                      suffix={stat.suffix}
                    />
                  </dd>
                  <p className="mt-1.5 text-2xs text-ink-4">{stat.label}</p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────
            A numbered vertical flow, not three equal cards, so it does
            not share a layout family with the section below it. */}
        <section id="how" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
            <Reveal>
              <h2 className="max-w-[16ch] text-4xl font-semibold text-ink text-balance">
                Set it up once, then stop thinking about it.
              </h2>
            </Reveal>

            <ol className="mt-14 flex flex-col">
              {STEPS.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 70}>
                  <div className="group grid gap-4 border-t border-line py-8 transition-colors duration-[var(--dur-base)] hover:border-line-3 sm:grid-cols-[auto_1fr_auto] sm:items-start sm:gap-8">
                    <span
                      data-numeric
                      className="font-mono text-3xl font-medium leading-none tracking-[-0.04em] text-ink-4 transition-colors duration-[var(--dur-base)] group-hover:text-accent sm:w-16"
                    >
                      0{index + 1}
                    </span>

                    <div className="max-w-[58ch]">
                      <h3 className="flex items-center gap-2.5 text-xl font-medium text-ink">
                        <step.icon
                          size={18}
                          aria-hidden="true"
                          className="shrink-0 text-ink-3"
                        />
                        {step.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-ink-3 text-pretty">
                        {step.body}
                      </p>
                    </div>

                    <span className="label-mono text-ink-4 sm:pt-2 sm:text-right">
                      {step.aside}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── What it does for you ─────────────────────────────────
            Asymmetric bento: one wide cell carries the argument, two
            narrow cells support it. Not a row of identical tiles. */}
        <section className="border-t border-line bg-surface-1/20">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
            <div className="grid gap-4 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <Spotlight className="edge-trace beam-border edge h-full rounded-xl border border-line bg-surface-1/60 p-7 backdrop-blur-md sm:p-9">
                  <Gauge size={22} aria-hidden="true" className="text-ink-3" />
                  <h3 className="mt-5 max-w-[22ch] text-3xl font-semibold text-ink text-balance">
                    You see the gaps without reading every review.
                  </h3>
                  <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-ink-3 text-pretty">
                    Reply rate, rating spread and the current queue sit on one
                    screen. The normal state is not looking at it, so the
                    exceptions need to be obvious the moment you do.
                  </p>
                </Spotlight>
              </Reveal>

              <div className="grid gap-4">
                <Reveal delay={70}>
                  <Spotlight className="edge-trace beam-border edge rounded-xl border border-line bg-surface-1/60 p-7 backdrop-blur-md">
                    <Clock size={20} aria-hidden="true" className="text-ink-3" />
                    <h3 className="mt-4 text-lg font-medium tracking-[-0.015em] text-ink">
                      Timing that reads human
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-3 text-pretty">
                      A reply landing four seconds after a review is the fastest
                      way to look automated. You set the delay.
                    </p>
                  </Spotlight>
                </Reveal>

                <Reveal delay={140}>
                  <Spotlight className="edge-trace beam-border edge rounded-xl border border-line bg-surface-1/60 p-7 backdrop-blur-md">
                    <ShieldCheck
                      size={20}
                      aria-hidden="true"
                      className="text-ink-3"
                    />
                    <h3 className="mt-4 text-lg font-medium tracking-[-0.015em] text-ink">
                      Access you can take back
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-3 text-pretty">
                      Read reviews and post replies for the locations you pick.
                      Nothing else on the account is touched.
                    </p>
                  </Spotlight>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── Close ────────────────────────────────────────────────
            The one place the page inverts its left-aligned rhythm, so
            the ending reads as an ending. */}
        <section className="relative overflow-hidden border-t border-line">
          <div aria-hidden="true" className="absolute inset-0 accent-wash" />
          <div className="relative mx-auto max-w-6xl px-5 py-28 text-center sm:px-8 sm:py-36">
            <Reveal>
              <h2 className="mx-auto max-w-[20ch] text-5xl font-semibold text-ink text-balance">
                Start with the reviews already waiting.
              </h2>
              <p className="mx-auto mt-6 max-w-[48ch] text-base leading-relaxed text-ink-3 text-pretty">
                Connect a location and ReviewMint drafts replies for your recent
                reviews first, so you can read the voice before anything posts.
              </p>
              <div className="mt-10 flex justify-center">
                <ButtonLink href={cta.href} size="lg">
                  {cta.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Wordmark size={22} />
              <p className="mt-2 max-w-[36ch] text-2xs leading-relaxed text-ink-4">
                Every Google review answered, automatically.
                <br />A product by NovaMint Networks.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/pricing" className="text-2xs text-ink-4 transition-colors hover:text-ink-2">Pricing</Link>
              <Link href="/faq" className="text-2xs text-ink-4 transition-colors hover:text-ink-2">FAQ</Link>
              <Link href="/contact" className="text-2xs text-ink-4 transition-colors hover:text-ink-2">Contact</Link>
              <Link href="/privacy" className="text-2xs text-ink-4 transition-colors hover:text-ink-2">Privacy</Link>
              <Link href="/terms" className="text-2xs text-ink-4 transition-colors hover:text-ink-2">Terms</Link>
              <Link href="/refund" className="text-2xs text-ink-4 transition-colors hover:text-ink-2">Refund Policy</Link>
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
    </div>
  );
}
