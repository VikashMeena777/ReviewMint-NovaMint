import { Star } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";
import { getInitials, hueFromString } from "@/lib/utils/helpers";
import type { ReviewStatus } from "@/types";

/* ── Stars ──────────────────────────────────────────────────────── */

const STAR_SIZE = { sm: 11, md: 13, lg: 16 } as const;

/**
 * Star rating. Rendered as an image role with a single accessible name
 * so a screen reader announces "4 out of 5 stars" instead of five icons.
 */
export function Stars({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: keyof typeof STAR_SIZE;
  className?: string;
}) {
  const px = STAR_SIZE[size];
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={px}
          weight={index <= rating ? "fill" : "regular"}
          aria-hidden="true"
          className={index <= rating ? "text-star" : "text-ink-4/45"}
        />
      ))}
    </span>
  );
}

/* ── Avatar ─────────────────────────────────────────────────────── */

const AVATAR_SIZE = {
  sm: "size-7 text-2xs",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
} as const;

/**
 * Initials avatar with a hue derived from the name, so the same person
 * keeps the same colour on every screen.
 */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZE;
  className?: string;
}) {
  const hue = hueFromString(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-md font-semibold",
        "border border-white/8",
        AVATAR_SIZE[size],
        className
      )}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 42% 26%), hsl(${(hue + 34) % 360} 38% 17%))`,
        color: `hsl(${hue} 62% 82%)`,
      }}
    >
      {getInitials(name)}
    </span>
  );
}

/* ── Badge ──────────────────────────────────────────────────────── */

type Tone = "neutral" | "accent" | "positive" | "caution" | "critical" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-2 border-line-2",
  accent: "bg-accent/12 text-accent border-accent/22",
  positive: "bg-positive/12 text-positive border-positive/22",
  caution: "bg-caution/12 text-caution border-caution/22",
  critical: "bg-critical/12 text-critical border-critical/22",
  info: "bg-info/12 text-info border-info/22",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-2xs font-medium tracking-[0.01em] whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── Reply status ───────────────────────────────────────────────── */

export const STATUS_META: Record<
  ReviewStatus,
  { label: string; tone: Tone }
> = {
  pending: { label: "Awaiting reply", tone: "neutral" },
  generating: { label: "Writing", tone: "info" },
  generated: { label: "Ready to post", tone: "accent" },
  posting: { label: "Posting", tone: "info" },
  posted: { label: "Posted", tone: "positive" },
  failed: { label: "Failed", tone: "critical" },
  skipped: { label: "Skipped", tone: "neutral" },
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export const SENTIMENT_TONE: Record<string, Tone> = {
  positive: "positive",
  neutral: "neutral",
  negative: "critical",
};
