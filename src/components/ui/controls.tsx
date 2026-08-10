"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

/* ── Field shell ────────────────────────────────────────────────── */

/**
 * Labelled field wrapper. The label is always rendered and always bound
 * to its control; placeholders demonstrate the expected value and never
 * stand in for the label.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-[-0.005em] text-ink-2"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          aria-live="polite"
          className="text-xs text-critical text-pretty"
        >
          {error}
        </p>
      ) : (
        hint && (
          <p
            id={`${htmlFor}-hint`}
            className="text-xs leading-relaxed text-ink-4 text-pretty"
          >
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const CONTROL =
  "w-full rounded-md border border-line-2 bg-surface-2 text-sm text-ink " +
  "placeholder:text-ink-4 " +
  "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
  "hover:border-line-3 " +
  "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/18 " +
  "disabled:cursor-not-allowed disabled:opacity-55 " +
  "aria-invalid:border-critical/60 aria-invalid:focus:border-critical aria-invalid:focus:ring-critical/18";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Leading glyph. Pass a Phosphor icon element. */
  icon?: React.ReactNode;
  /** Trailing control, for example a password reveal button. */
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, trailing, className, ...props },
  ref
) {
  if (!icon && !trailing) {
    return (
      <input ref={ref} className={cn(CONTROL, "h-10 px-3", className)} {...props} />
    );
  }

  return (
    <div className="relative">
      {icon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
        >
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          CONTROL,
          "h-10 px-3",
          icon && "pl-9.5",
          trailing && "pr-10",
          className
        )}
        {...props}
      />
      {trailing && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(CONTROL, "px-3 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
});

/* ── Segmented tabs ─────────────────────────────────────────────── */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Segmented filter control. A real tablist, so arrow keys and screen
 * readers behave. The active segment is marked by a filled surface, not
 * by a coloured dot.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-line bg-surface-1 p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5",
              "text-xs font-medium whitespace-nowrap",
              "transition-[background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
              active ? "bg-surface-3 text-ink" : "text-ink-3 hover:text-ink-2"
            )}
          >
            {option.label}
            {typeof option.count === "number" && (
              <span
                data-numeric
                className={cn(
                  "font-mono text-2xs",
                  active ? "text-ink-3" : "text-ink-4"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────── */

/**
 * Switch control built on a native checkbox, so labels, focus and form
 * semantics come for free.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) {
  const generated = useId();
  const controlId = id ?? generated;

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <label
          htmlFor={controlId}
          className="cursor-pointer text-sm font-medium text-ink"
        >
          {label}
        </label>
        {description && (
          <p className="mt-1 max-w-[58ch] text-xs leading-relaxed text-ink-3 text-pretty">
            {description}
          </p>
        )}
      </div>

      <label
        htmlFor={controlId}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border",
          "transition-[background-color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
          "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
          checked ? "border-accent/40 bg-accent" : "border-line-2 bg-surface-3"
        )}
      >
        <input
          id={controlId}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute size-full cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none ml-0.5 size-5 rounded-full",
            "transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
            checked ? "translate-x-4 bg-accent-ink" : "translate-x-0 bg-ink-3"
          )}
        />
      </label>
    </div>
  );
}

/* ── Chips ──────────────────────────────────────────────────────── */

/** Compact single-choice row for small option sets. */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-full border px-3.5 text-xs font-medium",
              "transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
              "active:scale-[0.97]",
              active
                ? "border-accent/45 bg-accent/12 text-accent"
                : "border-line-2 bg-surface-2 text-ink-3 hover:border-line-3 hover:text-ink-2"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Choice grid ────────────────────────────────────────────────── */

/**
 * Single-choice grid where each option carries an explanation. Used
 * where the difference between options is not obvious from the label
 * alone.
 */
export function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; description: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-2.5 sm:grid-cols-2"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md border p-3.5 text-left",
              "transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
              "active:scale-[0.99]",
              active
                ? "border-accent/45 bg-accent/8"
                : "border-line-2 bg-surface-2 hover:border-line-3"
            )}
          >
            <span
              className={cn(
                "block text-sm font-medium",
                active ? "text-accent" : "text-ink"
              )}
            >
              {option.label}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-3 text-pretty">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
