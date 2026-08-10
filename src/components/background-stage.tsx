/**
 * Fixed background stage, rendered once per page root.
 *
 * Layers, back to front: ambient light on the stage itself (a warm arc
 * from the top plus a cool counter-light from the bottom), a dot
 * matrix, three aurora fields, an optional one-shot hero beam, then a
 * gentle vignette drawn above everything so no bloom shows a hard edge.
 *
 * Two variants:
 *   "marketing"  full aurora, denser dots, hero beam. Landing + auth.
 *   "app"        softer fields and a faint matrix. Enough depth to
 *                stop the canvas reading as dead without competing
 *                with dashboard data.
 *
 * Nothing autoplays. Every moving layer is bound to scroll position
 * through `animation-timeline: scroll()`, so the user is the clock and
 * the page is completely still while idle. That keeps it clear of WCAG
 * 2.2.2, which requires a pause control for motion running over five
 * seconds.
 *
 * Server Component: pure CSS, no JavaScript, no hydration cost.
 */
export function BackgroundStage({
  variant = "marketing",
}: {
  variant?: "marketing" | "app";
}) {
  return (
    <div className="bg-stage" data-bg={variant} aria-hidden="true">
      <div className="bg-dots" />
      <div className="bg-aurora bg-aurora-1" />
      <div className="bg-aurora bg-aurora-2" />
      <div className="bg-aurora bg-aurora-3" />
      {variant === "marketing" && <div className="bg-beam" />}
    </div>
  );
}
