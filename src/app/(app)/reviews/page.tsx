"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowClockwise, ChatTeardropText } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/states";
import { ReviewRow, ReviewRowSkeleton } from "@/components/review-row";
import type { Review, ReviewStatus } from "@/types";

type Filter = "all" | "pending" | "posted" | "failed";

const FILTER_STATUS: Record<Exclude<Filter, "all">, ReviewStatus[]> = {
  pending: ["pending", "generating", "generated", "posting"],
  posted: ["posted"],
  failed: ["failed"],
};

const EMPTY_COPY: Record<Filter, { title: string; description: string }> = {
  all: {
    title: "No reviews yet",
    description:
      "Once a location is connected, new Google reviews appear here within minutes of being posted.",
  },
  pending: {
    title: "Nothing waiting",
    description:
      "Every review has been answered. New ones will queue here as they arrive.",
  },
  posted: {
    title: "No replies posted yet",
    description:
      "Replies show up here the moment they go live on your Google Business Profile.",
  },
  failed: {
    title: "No failures",
    description:
      "Nothing has failed to post. If a reply ever does, it will be listed here with the reason.",
  },
};

const EMPTY_COUNTS: Record<Filter, number> = {
  all: 0,
  pending: 0,
  posted: 0,
  failed: 0,
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Record<Filter, number>>(EMPTY_COUNTS);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  /**
   * Pure fetcher: reads the filtered page plus the status tallies and
   * returns them. It writes no state, so callers decide what a load means
   * for the loading and refreshing flags.
   */
  const fetchReviews = useCallback(async (target: Filter) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { rows: [] as Review[], counts: EMPTY_COUNTS };
    }

    let query = supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("review_created_at", { ascending: false })
      .range(0, 49);

    if (target !== "all") {
      query = query.in("reply_status", FILTER_STATUS[target]);
    }

    const [{ data: rows }, { data: all }] = await Promise.all([
      query,
      supabase.from("reviews").select("reply_status").eq("user_id", user.id),
    ]);

    const statuses = (all ?? []) as { reply_status: ReviewStatus }[];

    return {
      rows: (rows as Review[]) ?? [],
      counts: {
        all: statuses.length,
        pending: statuses.filter((r) =>
          FILTER_STATUS.pending.includes(r.reply_status)
        ).length,
        posted: statuses.filter((r) => r.reply_status === "posted").length,
        failed: statuses.filter((r) => r.reply_status === "failed").length,
      },
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { rows, counts: tallies } = await fetchReviews(filter);
      if (cancelled) return;
      setReviews(rows);
      setCounts(tallies);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [filter, fetchReviews]);

  // Loading is raised on the interaction that causes it, not in the effect
  // that reacts to it.
  function selectFilter(next: Filter) {
    if (next === filter) return;
    setLoading(true);
    setFilter(next);
  }

  async function refresh() {
    setRefreshing(true);
    const { rows, counts: tallies } = await fetchReviews(filter);
    setReviews(rows);
    setCounts(tallies);
    setRefreshing(false);
  }

  async function generateReply(reviewId: string) {
    setGeneratingId(reviewId);
    try {
      const response = await fetch("/api/reviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "The reply could not be generated.");
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                ai_reply: result.reply,
                sentiment: result.sentiment,
                reply_status: "generated" as ReviewStatus,
              }
            : review
        )
      );
      toast.success("Reply written. It posts on the next sync.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The reply could not be generated. Try again in a moment."
      );
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Every review pulled from your connected locations, newest first."
        action={
          <Button
            variant="secondary"
            onClick={refresh}
            loading={refreshing}
            loadingLabel="Refreshing…"
          >
            {!refreshing && <ArrowClockwise size={14} aria-hidden="true" />}
            Refresh
          </Button>
        }
      />

      <Segmented
        label="Filter reviews by reply status"
        value={filter}
        onChange={selectFilter}
        options={[
          { value: "all", label: "All", count: counts.all },
          { value: "pending", label: "Waiting", count: counts.pending },
          { value: "posted", label: "Posted", count: counts.posted },
          { value: "failed", label: "Failed", count: counts.failed },
        ]}
      />

      <Panel>
        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1, 2, 3].map((row) => (
              <ReviewRowSkeleton key={row} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<ChatTeardropText size={19} aria-hidden="true" />}
            title={EMPTY_COPY[filter].title}
            description={EMPTY_COPY[filter].description}
            action={
              filter === "all" && counts.all === 0 ? (
                <ButtonLink href="/connections">Connect a location</ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                onGenerate={generateReply}
                generating={generatingId === review.id}
              />
            ))}
          </div>
        )}
      </Panel>

      {!loading && reviews.length >= 50 && (
        <p className="text-center text-xs text-ink-4">
          Showing the 50 most recent reviews.
        </p>
      )}
    </div>
  );
}
