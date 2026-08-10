"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink shadow-[var(--shadow-accent)] " +
    "hover:bg-accent-hi hover:-translate-y-px hover:shadow-[0_10px_28px_-8px_rgb(44_217_166/0.55)] " +
    "active:bg-accent-lo active:translate-y-0",
  secondary:
    "bg-surface-3 text-ink border border-line-2 shadow-[var(--edge-hi)] " +
    "hover:bg-surface-4 hover:border-line-3 hover:-translate-y-px active:translate-y-0",
  ghost:
    "text-ink-2 border border-transparent hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-critical/12 text-critical border border-critical/25 " +
    "hover:bg-critical/20 hover:border-critical/40 hover:-translate-y-px active:translate-y-0",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9.5 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
};

/**
 * Shared control styling. Exported so a `Link` can adopt button
 * appearance without wrapping an anchor in a button, which would break
 * Cmd-click and middle-click.
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap",
    "font-medium tracking-[-0.01em]",
    "transition-[background-color,border-color,color,transform,box-shadow]",
    "duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks activation without disabling the button. */
  loading?: boolean;
  /** Label rendered while `loading` is true. Falls back to children. */
  loadingLabel?: string;
  fullWidth?: boolean;
}

/**
 * Primary action control.
 *
 * The button stays enabled while `loading` so keyboard focus is never
 * dropped mid-request; activation is blocked through `aria-disabled`
 * plus an early return in the click handler instead.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingLabel,
      fullWidth = false,
      className,
      children,
      disabled,
      onClick,
      type = "button",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
        disabled={disabled}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        className={cn(
          buttonStyles({ variant, size, fullWidth }),
          loading && "cursor-progress",
          className
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-3.5 shrink-0 rounded-full border-[1.5px] border-current border-t-transparent animate-spin-fast"
          />
        )}
        {loading && loadingLabel ? loadingLabel : children}
      </button>
    );
  }
);

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/** A real anchor that looks like a button. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
