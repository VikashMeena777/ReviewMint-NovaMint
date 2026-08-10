// ─── Formatting helpers ──────────────────────────────────────────
// All date and number output goes through Intl so locale, timezone
// and hydration behave predictably.

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

/** Relative time such as "3 hours ago" or "yesterday". */
export function timeAgo(dateString: string): string {
  let duration = (new Date(dateString).getTime() - Date.now()) / 1000;

  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return RELATIVE.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return RELATIVE.format(Math.round(duration), "year");
}

const DATE_SHORT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const DATE_LONG = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const TIME_SHORT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

/** "14 Mar" for the current year, "14 Mar 2024" otherwise. */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.getFullYear() === new Date().getFullYear()
    ? DATE_SHORT.format(date)
    : DATE_LONG.format(date);
}

/** "14 Mar 2024, 4:30 pm" */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${DATE_LONG.format(date)}, ${TIME_SHORT.format(date)}`;
}

const NUMBER = new Intl.NumberFormat("en-IN");

/** Grouped integer, Indian digit grouping. */
export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Whole rupees, no decimals. */
export function formatCurrency(value: number): string {
  return CURRENCY.format(value);
}

/** Up to two initials, uppercased. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Truncate on a word boundary and append a real ellipsis character. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** Whole days left before a trial ends, floored at zero. */
export function daysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, diff);
}

/**
 * Deterministic hue from a string. Used for reviewer avatars so the same
 * person keeps the same colour between renders and across pages.
 */
export function hueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
