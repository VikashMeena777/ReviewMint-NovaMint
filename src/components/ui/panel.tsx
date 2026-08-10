import { cn } from "@/lib/utils/cn";

/**
 * Panel is the single container primitive. Elevation comes from surface
 * luminance plus a translucent top highlight, so edges catch light like
 * real material. There is no separate card or glass-card variant.
 *
 * `interactive` adds lift on hover and is only for panels that are
 * genuinely clickable or that host a primary action.
 */
export function Panel({
  className,
  interactive = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "edge rounded-lg border border-line bg-surface-1/80 backdrop-blur-sm",
        interactive && [
          "transition-[border-color,transform,box-shadow]",
          "duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
          "hover:-translate-y-0.5 hover:border-line-3",
          "hover:shadow-[var(--edge-hi),var(--shadow-lg)]",
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line px-5 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="label-caps text-ink-3">{title}</h2>
        {description && (
          <p className="mt-2 text-xs text-ink-4 text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PanelBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
