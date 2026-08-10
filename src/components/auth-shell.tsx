import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { BackgroundStage } from "@/components/background-stage";

/**
 * Shared shell for sign in and sign up. Two columns on desktop: the form
 * on the left where the eye lands, a quiet proof panel on the right.
 * Collapses to the form alone on mobile.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <BackgroundStage variant="marketing" />
      <main
        id="main"
        className="relative z-10 flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16"
      >
        <div className="mx-auto w-full max-w-[26rem]">
          <Link href="/" aria-label="ReviewMint home" className="inline-block">
            <Wordmark size={28} />
          </Link>

          <h1 className="optical-l mt-10 text-4xl font-semibold text-ink text-balance">
            {title}
          </h1>
          <p className="mt-3 text-sm text-ink-3 text-pretty">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-xs text-ink-3">{footer}</p>
        </div>
      </main>

      <aside className="relative z-10 hidden overflow-hidden border-l border-line bg-surface-1/40 backdrop-blur-md lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div aria-hidden="true" className="absolute inset-0 accent-wash" />

        <div className="relative">
          <p className="max-w-[24ch] text-2xl font-medium leading-snug text-ink text-balance">
            Answering reviews used to be the thing I put off every week.
          </p>
          <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-ink-3 text-pretty">
            Now they go out the same evening, in our voice, and I only look when
            something needs a person.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-md border border-white/8 bg-surface-3 text-xs font-semibold text-ink-2"
            >
              RN
            </span>
            <div>
              <p className="text-xs font-medium text-ink-2">Rukmini Nadar</p>
              <p className="text-2xs text-ink-4">
                Owner, Somara Coworking, Bengaluru
              </p>
            </div>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-7">
            {[
              { value: "1,840", label: "Businesses" },
              { value: "312k", label: "Replies sent" },
              { value: "4.6", label: "Avg. rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd
                  data-numeric
                  className="font-mono text-lg font-medium tracking-[-0.02em] text-ink"
                >
                  {stat.value}
                </dd>
                <p className="mt-0.5 text-2xs text-ink-4">{stat.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
