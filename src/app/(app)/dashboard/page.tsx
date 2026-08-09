"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquareText,
  TrendingUp,
  Clock,
  AlertTriangle,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Review } from "@/types";
import { timeAgo, getInitials } from "@/lib/utils/helpers";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.2, 0, 0, 1] as const,
    },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function DashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("review_created_at", { ascending: false })
        .range(0, 19);

      if (data) setReviews(data as Review[]);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce((s, r) => s + r.star_rating, 0) / totalReviews
        ).toFixed(1)
      : "0.0";
  const repliedCount = reviews.filter(
    (r) => r.reply_status === "posted"
  ).length;
  const responseRate =
    totalReviews > 0
      ? Math.round((repliedCount / totalReviews) * 100)
      : 0;
  const pendingCount = reviews.filter(
    (r) => r.reply_status === "pending" || r.reply_status === "generating"
  ).length;

  const stats = [
    {
      label: "Total Reviews",
      value: totalReviews,
      icon: MessageSquareText,
      accent: "var(--accent)",
      bg: "var(--accent-muted)",
    },
    {
      label: "Average Rating",
      value: avgRating,
      icon: Star,
      accent: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.08)",
    },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      icon: TrendingUp,
      accent: "var(--accent)",
      bg: "var(--accent-muted)",
    },
    {
      label: "Pending Replies",
      value: pendingCount,
      icon: Clock,
      accent: "var(--warning)",
      bg: "rgba(245, 158, 11, 0.08)",
    },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--fg-primary)",
            marginBottom: "0.25rem",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            color: "var(--fg-tertiary)",
            fontSize: "0.875rem",
          }}
        >
          Your review management overview
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i + 1}
            className="card"
            style={{ padding: "1.25rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--fg-quaternary)",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <stat.icon size={16} style={{ color: stat.accent }} />
              </div>
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--fg-primary)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: 60,
                    height: 28,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface-2)",
                  }}
                  className="animate-pulse"
                />
              ) : (
                stat.value
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Reviews */}
      <motion.div variants={fadeUp} custom={5}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--fg-primary)",
            }}
          >
            Recent Reviews
          </h2>
          {reviews.length > 0 && (
            <Link
              href="/reviews"
              className="btn-ghost"
              style={{
                fontSize: "0.8125rem",
                padding: "0.375rem 0.75rem",
              }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card animate-pulse"
                style={{ height: 88, padding: 0 }}
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State */
          <div
            className="card"
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius-lg)",
                background: "var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Sparkles size={24} style={{ color: "var(--accent)" }} />
            </div>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--fg-primary)",
                marginBottom: "0.375rem",
              }}
            >
              No Reviews Yet
            </h3>
            <p
              style={{
                color: "var(--fg-tertiary)",
                fontSize: "0.875rem",
                maxWidth: 400,
                margin: "0 auto 1.5rem",
                lineHeight: 1.6,
              }}
            >
              Connect your Google Business Profile to start auto-responding to
              reviews with AI.
            </p>
            <Link href="/connections" className="btn-primary">
              Connect Google Profile
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          /* Review List */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {reviews.slice(0, 5).map((review, i) => (
              <motion.div
                key={review.id}
                variants={fadeUp}
                custom={6 + i}
                className="card"
                style={{ padding: "1.25rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "var(--surface-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--fg-primary)",
                    }}
                  >
                    {getInitials(review.reviewer_name)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                        flexWrap: "wrap",
                        gap: "0.375rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            color: "var(--fg-primary)",
                          }}
                        >
                          {review.reviewer_name}
                        </span>
                        <div style={{ display: "flex", gap: "1px" }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              fill={
                                s <= review.star_rating
                                  ? "#fbbf24"
                                  : "transparent"
                              }
                              color={
                                s <= review.star_rating
                                  ? "#fbbf24"
                                  : "var(--fg-quaternary)"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          color: "var(--fg-quaternary)",
                        }}
                      >
                        {timeAgo(review.review_created_at)}
                      </span>
                    </div>

                    {review.review_text && (
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--fg-secondary)",
                          lineHeight: 1.6,
                          marginBottom: review.ai_reply ? "0.75rem" : 0,
                        }}
                      >
                        {review.review_text}
                      </p>
                    )}

                    {review.ai_reply && (
                      <div
                        style={{
                          background: "var(--accent-subtle)",
                          borderLeft: "2px solid var(--accent)",
                          borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                          padding: "0.625rem 0.75rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            marginBottom: "0.25rem",
                            fontSize: "0.6875rem",
                            color: "var(--accent)",
                            fontWeight: 600,
                          }}
                        >
                          <Bot size={11} />
                          {review.reply_status === "posted"
                            ? "AI Reply • Posted"
                            : "AI Reply • Pending"}
                        </div>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--fg-secondary)",
                            lineHeight: 1.6,
                          }}
                        >
                          {review.ai_reply}
                        </p>
                      </div>
                    )}

                    {review.reply_status === "pending" && !review.ai_reply && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          marginTop: "0.5rem",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "var(--radius-pill)",
                          background: "rgba(245, 158, 11, 0.08)",
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          color: "var(--warning)",
                        }}
                      >
                        <Clock size={11} />
                        Pending AI reply
                      </div>
                    )}

                    {review.reply_status === "failed" && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          marginTop: "0.5rem",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "var(--radius-pill)",
                          background: "rgba(239, 68, 68, 0.08)",
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          color: "var(--error)",
                        }}
                      >
                        <AlertTriangle size={11} />
                        Reply failed
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
