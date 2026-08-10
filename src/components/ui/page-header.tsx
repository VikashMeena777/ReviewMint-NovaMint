import { cn } from "@/lib/utils/cn";

/**
 * Page header. One per screen, giving the page a title, a one-line
 * orientation and up to one primary action.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="optical-l text-3xl font-semibold text-ink text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-[62ch] text-sm text-ink-3 text-pretty">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
