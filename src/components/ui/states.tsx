import { cn } from "@/lib/utils/cn";

/**
 * Empty state. Composed rather than decorative: it names what is
 * missing and gives exactly one way to fix it.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="mb-4 grid size-11 place-items-center rounded-lg border border-line-2 bg-surface-2 text-ink-3"
      >
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-ink text-balance">{title}</h3>
      <p className="mt-1.5 max-w-[38ch] text-xs leading-relaxed text-ink-3 text-pretty">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * Shape-matched loading placeholder. Always mirrors the real layout so
 * nothing shifts when data lands.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton", className)}
      {...props}
    />
  );
}
