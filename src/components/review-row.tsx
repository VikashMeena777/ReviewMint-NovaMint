"use client";

import { Sparkle, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  Badge,
  Stars,
  StatusBadge,
  SENTIMENT_TONE,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/helpers";
import type { Review } from "@/types";

/**
 * Single review row. One implementation, used by both the overview and
 * the reviews table, so the two screens can never drift apart again.
 *
 * Rows are separated by a hairline instead of being wrapped in
 * individual cards: the list is the object, not each item.
 */
export function ReviewRow({
  review,
  onGenerate,
  generating = false,
  className,
}: {
  review: Review;
  onGenerate?: (id: string) => void;
  generating?: boolean;
  className?: string;
}) {
  const canGenerate =
    onGenerate && !review.ai_reply && review.reply_status === "pending";

  return (
    <article
      className={cn(
        "group/row relative px-5 py-4",
        "transition-colors duration-[var(--dur-fast)] hover:bg-surface-1/60",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={review.reviewer_name} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="truncate text-sm font-medium text-ink">
              {review.reviewer_name}
            </h3>
            <Stars rating={review.star_rating} size="sm" />
            <time
              dateTime={review.review_created_at}
              className="font-mono text-2xs text-ink-4"
              data-numeric
            >
              {timeAgo(review.review_created_at)}
            </time>
          </div>

          {review.review_text ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-2 text-pretty break-words">
              {review.review_text}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-ink-4">
              Rating only, no written review.
            </p>
          )}

          {review.ai_reply && (
            /* Indented and hairline-topped rather than a rounded tile with
               a colored left border, which is the stock "AI dashboard
               card" shape. The indent alone reads as a threaded reply. */
            <div className="mt-3.5 border-t border-line pt-3 pl-3.5">
              <span className="text-2xs font-medium uppercase tracking-[0.12em] text-accent">
                {review.reply_posted_at ? "Replied" : "Draft reply"}
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2 text-pretty break-words">
                {review.ai_reply}
              </p>
            </div>
          )}

          {review.reply_status === "failed" && review.failure_reason && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-critical">
              <WarningCircle
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              <span className="text-pretty">
                {review.failure_reason} Reconnect the location and this review
                will retry on the next sync.
              </span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={review.reply_status} />
            {review.sentiment && (
              <Badge tone={SENTIMENT_TONE[review.sentiment] ?? "neutral"}>
                {review.sentiment}
              </Badge>
            )}
            {canGenerate && (
              <Button
                size="sm"
                variant="secondary"
                loading={generating}
                loadingLabel="Writing…"
                onClick={() => onGenerate(review.id)}
                className="ml-auto"
              >
                {!generating && (
                  <Sparkle size={13} weight="fill" aria-hidden="true" />
                )}
                Write reply
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder shaped like a review row. */
export function ReviewRowSkeleton() {
  return (
    <div className="flex items-start gap-3.5 px-5 py-4">
      <div className="skeleton size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="skeleton h-3.5 w-36" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/5" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}
