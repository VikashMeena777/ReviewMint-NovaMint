"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Reveals children once when they scroll into view.
 *
 * IntersectionObserver rather than a scroll listener, so nothing runs
 * per frame, and the observer disconnects after the first reveal.
 * Reduced-motion users get the content immediately via CSS.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Stagger offset in ms. Keep under ~200ms so lists never feel slow. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "figure";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If the browser cannot observe, show content rather than hide it.
    if (typeof IntersectionObserver === "undefined") {
      node.setAttribute("data-inview", "");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-inview", "");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-reveal=""
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties)
          : undefined
      }
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Tracks the pointer inside a card and exposes it as CSS variables for
 * the `.spotlight` treatment. Values are written straight to the node's
 * style, never to React state, so pointer movement never re-renders.
 *
 * With `tilt`, the card also rotates slightly toward the pointer. The
 * rotation is reset on leave so the transform only exists during hover.
 */
export function Spotlight({
  children,
  className,
  tilt = false,
  maxTilt = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tilt?: boolean;
  /** Peak rotation in degrees. Keep small; past ~6deg text distorts. */
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onPointerMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        node.style.setProperty("--spot-x", `${x}px`);
        node.style.setProperty("--spot-y", `${y}px`);

        if (tilt) {
          // Map pointer position to [-1, 1] on each axis from the centre.
          const px = (x / rect.width) * 2 - 1;
          const py = (y / rect.height) * 2 - 1;
          node.style.setProperty("--tilt-y", `${px * maxTilt}deg`);
          node.style.setProperty("--tilt-x", `${-py * maxTilt}deg`);
        }
      }}
      onPointerLeave={() => {
        const node = ref.current;
        if (!node || !tilt) return;
        node.style.setProperty("--tilt-x", "0deg");
        node.style.setProperty("--tilt-y", "0deg");
      }}
      className={cn("spotlight", tilt && "tilt", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Counts up to `value` once, when scrolled into view.
 *
 * The DOM text is written through a ref instead of React state, so a
 * 700ms count costs zero re-renders. The final value is always written
 * exactly, and reduced-motion users get it immediately with no count.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const format = (n: number) =>
      n.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;

    const settle = () => {
      node.textContent = format(value);
    };

    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      settle();
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || done.current) continue;
          done.current = true;
          observer.disconnect();

          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // easeOutExpo, matching --ease-out-expo
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            node.textContent = format(value * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
            else settle();
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, decimals, suffix, duration]);

  // Server render carries the final value so there is no layout shift
  // and no empty flash before hydration.
  return (
    <span ref={ref} data-numeric className={className}>
      {value.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/**
 * Cycles a short list of phrases in place.
 *
 * Bounded on purpose: it advances only while visible and stops after
 * one full pass, so it never becomes indefinite background motion.
 */
export function Rotator({
  items,
  interval = 2200,
  className,
}: {
  items: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || items.length < 2) return;

    // One pass only. Stops on the last item and never loops.
    if (index >= items.length - 1) return;

    const id = setTimeout(() => setIndex((i) => i + 1), interval);
    return () => clearTimeout(id);
  }, [index, items.length, interval]);

  return (
    <span className={cn("relative inline-block align-bottom", className)}>
      {/* Reserve the widest phrase so the line never reflows mid-cycle. */}
      <span aria-hidden="true" className="invisible block whitespace-nowrap">
        {items.reduce((a, b) => (b.length > a.length ? b : a), "")}
      </span>
      <span
        key={index}
        className="animate-fade-up absolute inset-0 whitespace-nowrap text-accent"
      >
        {items[index]}
      </span>
      <span className="sr-only">{items[items.length - 1]}</span>
    </span>
  );
}

/**
 * A single soft glow that follows the pointer across the whole page.
 *
 * Position is written directly to the node through a rAF-throttled
 * transform, so pointer movement costs one style write per frame and
 * zero React renders. Hidden entirely on touch devices and under
 * reduced-motion, where it would be meaningless or unwelcome.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Pointer glow only makes sense for a fine pointer.
    if (
      typeof matchMedia === "undefined" ||
      !matchMedia("(hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let raf = 0;
    let x = 0;
    let y = 0;

    const draw = () => {
      raf = 0;
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      node.setAttribute("data-active", "");
      // Coalesce to one write per frame regardless of event rate.
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onLeave = () => node.removeAttribute("data-active");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
