"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChatTeardropText,
  Clock,
  PlugsConnected,
  Star,
  TrendUp,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/cn";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { ReviewRow, ReviewRowSkeleton } from "@/components/review-row";
import { RatingBars, ReplyTrend } from "@/components/charts";
import type { Review } from "@/types";

/** Rolling window used for the reply-volume trend. */
const TREND_DAYS = 14;

export default function DashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("review_created_at", { ascending: false })
        .range(0, 199);

      if (!cancelled) {
        setReviews((data as Review[]) ?? []);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const replied = reviews.filter((r) => r.reply_status === "posted").length;
    const pending = reviews.filter(
      (r) => r.reply_status === "pending" || r.reply_status === "generated"
    ).length;
    const ratingSum = reviews.reduce((sum, r) => sum + r.star_rating, 0);

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.star_rating === star).length,
    }));

    // Bucket posted replies by day for the trend line.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trend = Array.from({ length: TREND_DAYS }, (_, index) => {
      const day = new Date(today);
      day.setDate(day.getDate() - (TREND_DAYS - 1 - index));
      const next = new Date(day);
      next.setDate(next.getDate() + 1);

      return {
        date: day.toISOString(),
        replies: reviews.filter((r) => {
          if (!r.reply_posted_at) return false;
          const posted = new Date(r.reply_posted_at).getTime();
          return posted >= day.getTime() && posted < next.getTime();
        }).length,
      };
    });

    return {
      total,
      replied,
      pending,
      average: total ? ratingSum / total : 0,
      responseRate: total ? Math.round((replied / total) * 100) : 0,
      distribution,
      trend,
    };
  }, [reviews]);

  const recent = reviews.slice(0, 6);
  const hasTrend = stats.trend.some((point) => point.replies > 0);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Overview"
        description="Reply coverage across every location you have connected."
        action={
          <ButtonLink href="/reviews" variant="secondary">
            All reviews
            <ArrowRight size={14} aria-hidden="true" />
          </ButtonLink>
        }
      />

      {/* Metrics. Reply rate is the number this product exists to move, so
          it wins the hierarchy outright and the rest read as supporting
          context. Four equal tiles would say nothing is important. */}
      <Panel className="beam-border overflow-hidden">
        <dl className="grid lg:grid-cols-[1.1fr_1.4fr]">
          <div className="border-b border-line px-6 py-6 lg:border-b-0 lg:border-r">
            <dt className="label-caps flex items-center gap-1.5 text-ink-4">
              <TrendUp size={13} aria-hidden="true" className="text-accent" />
              Reply rate
            </dt>
            <dd className="mt-3 flex items-baseline gap-2.5">
              {loading ? (
                <Skeleton className="h-12 w-28" />
              ) : (
                <>
                  <span
                    data-numeric
                    className="font-mono text-5xl font-medium leading-none tracking-[-0.04em] text-ink"
                  >
                    {stats.responseRate}
                    <span className="text-2xl text-ink-4">%</span>
                  </span>
                  <span className="text-xs text-ink-4">
                    {formatNumber(stats.replied)} of {formatNumber(stats.total)}
                  </span>
                </>
              )}
            </dd>
            {!loading && (
              <div
                aria-hidden="true"
                className="mt-4 h-1 overflow-hidden rounded-full bg-surface-3"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]"
                  style={{ width: `${stats.responseRate}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 divide-x divide-line">
            <Metric
              label="Reviews"
              value={formatNumber(stats.total)}
              icon={<ChatTeardropText size={13} aria-hidden="true" />}
              loading={loading}
            />
            <Metric
              label="Rating"
              value={stats.total ? stats.average.toFixed(2) : "0.00"}
              icon={<Star size={13} weight="fill" aria-hidden="true" />}
              accent="star"
              loading={loading}
            />
            <Metric
              label="In queue"
              value={formatNumber(stats.pending)}
              icon={<Clock size={13} aria-hidden="true" />}
              accent={stats.pending > 0 ? "caution" : undefined}
              loading={loading}
            />
          </div>
        </dl>
      </Panel>

      {/* Charts. Trend gets the wider column because it carries the story. */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader
            title="Replies posted"
            description={`Last ${TREND_DAYS} days`}
          />
          <div className="p-5 pt-4">
            {loading ? (
              <Skeleton className="h-[168px] w-full rounded-md" />
            ) : hasTrend ? (
              <ReplyTrend data={stats.trend} />
            ) : (
              <p className="grid h-[168px] place-items-center text-xs text-ink-4">
                No replies posted in this window yet.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Rating spread" description="All time" />
          <div className="p-5 pt-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((row) => (
                  <Skeleton key={row} className="h-5 w-full" />
                ))}
              </div>
            ) : stats.total ? (
              <RatingBars data={stats.distribution} total={stats.total} />
            ) : (
              <p className="grid h-[168px] place-items-center text-xs text-ink-4">
                Nothing to chart yet.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Latest reviews"
          description="Newest first, with the reply that went out."
          action={
            <Link
              href="/reviews"
              className="text-xs font-medium text-ink-3 transition-colors duration-[var(--dur-fast)] hover:text-accent"
            >
              View all
            </Link>
          }
        />

        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1, 2].map((row) => (
              <ReviewRowSkeleton key={row} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<PlugsConnected size={19} aria-hidden="true" />}
            title="No reviews yet"
            description="Connect a Google Business Profile location and ReviewMint starts pulling reviews within a few minutes."
            action={
              <ButtonLink href="/connections">
                Connect a location
                <ArrowRight size={14} aria-hidden="true" />
              </ButtonLink>
            }
          />
        ) : (
          <div className="divide-y divide-line">
            {recent.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

const ACCENTS = {
  accent: "text-accent",
  star: "text-star",
  caution: "text-caution",
} as const;

function Metric({
  label,
  value,
  icon,
  accent,
  loading,
  className,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: keyof typeof ACCENTS;
  loading: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-6 sm:px-5", className)}>
      <dt className="label-caps flex items-center gap-1.5 text-ink-4">
        <span className={accent ? ACCENTS[accent] : "text-ink-4"}>{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-3">
        {loading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          <span
            data-numeric
            className="font-mono text-xl font-medium tracking-[-0.03em] text-ink-2"
          >
            {value}
          </span>
        )}
      </dd>
    </div>
  );
}
