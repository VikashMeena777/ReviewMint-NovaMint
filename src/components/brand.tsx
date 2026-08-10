import { cn } from "@/lib/utils/cn";

/**
 * ReviewMint mark: a speech bubble whose tail doubles as a rising
 * stroke. Single geometric glyph, drawn once and reused everywhere at
 * different sizes so the brand never drifts between pages.
 */
export function Mark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-md bg-accent text-accent-ink",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        style={{ width: size * 0.64, height: size * 0.64 }}
      >
        <path
          d="M4 6.5h16v9.5H9.5L5.5 20v-4H4z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12.6l2.6 2.1 4.4-5.1"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({
  size = 28,
  showText = true,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark size={size} />
      {showText && (
        <span
          translate="no"
          className="text-[15px] font-semibold tracking-[-0.025em] text-ink"
        >
          ReviewMint
        </span>
      )}
    </span>
  );
}
