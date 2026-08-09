"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Star,
  Bot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Filter,
  Sparkles,
  MessageSquareText,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { Review } from "@/types";
import { timeAgo, getInitials } from "@/lib/utils/helpers";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type FilterType = "all" | "pending" | "posted" | "failed";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const supabase = createClient();

  async function loadReviews() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("review_created_at", { ascending: false })
      .range(0, 49);

    if (filter === "pending") query = query.in("reply_status", ["pending", "generating"]);
    else if (filter === "posted") query = query.eq("reply_status", "posted");
    else if (filter === "failed") query = query.eq("reply_status", "failed");

    const { data } = await query;
    if (data) setReviews(data as Review[]);
    setLoading(false);
  }

  useEffect(() => { loadReviews(); }, [filter]);

  async function handleGenerateReply(reviewId: string) {
    setGeneratingId(reviewId);
    try {
      const response = await fetch("/api/reviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate reply");
      }

      const data = await response.json();
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, ai_reply: data.reply, reply_status: "generated" as const, sentiment: data.sentiment }
            : r
        )
      );
      toast.success("AI reply generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate reply");
    } finally {
      setGeneratingId(null);
    }
  }

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All", count: reviews.length },
    { key: "pending", label: "Pending" },
    { key: "posted", label: "Posted" },
    { key: "failed", label: "Failed" },
  ];

  const statusConfig: Record<string, { icon: typeof Clock; label: string; className: string }> = {
    pending: { icon: Clock, label: "Pending", className: "status-pending" },
    generating: { icon: Loader2, label: "Generating...", className: "status-generated" },
    generated: { icon: Sparkles, label: "Generated", className: "status-generated" },
    posting: { icon: RefreshCw, label: "Posting...", className: "status-generated" },
    posted: { icon: CheckCircle2, label: "Posted", className: "status-posted" },
    failed: { icon: AlertTriangle, label: "Failed", className: "status-failed" },
    skipped: { icon: Clock, label: "Skipped", className: "status-pending" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="heading-section" style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Reviews</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Manage your Google reviews and AI replies</p>
        </div>
        <button onClick={loadReviews} className="btn-ghost" style={{ gap: "0.375rem" }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "0.4375rem 0.875rem",
              borderRadius: "999px",
              fontSize: "0.8125rem",
              fontWeight: filter === f.key ? 600 : 400,
              background: filter === f.key ? "var(--primary-glow)" : "var(--glass)",
              color: filter === f.key ? "var(--primary)" : "var(--text-secondary)",
              border: `1px solid ${filter === f.key ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Review List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-shimmer" style={{ height: "120px", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--primary-glow)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <MessageSquareText size={28} style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="heading-section" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            {filter === "all" ? "No Reviews Yet" : `No ${filter} reviews`}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: "400px", margin: "0 auto 1.5rem" }}>
            {filter === "all"
              ? "Connect your Google Business Profile to start receiving and replying to reviews."
              : "Try changing the filter to see more reviews."}
          </p>
          {filter === "all" && (
            <Link href="/connections" className="btn-primary">
              Connect Google Profile <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {reviews.map((review, i) => {
            const status = statusConfig[review.reply_status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div key={review.id} variants={fadeUp} custom={i} className="glass-card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, hsl(${(review.reviewer_name.charCodeAt(0) * 47) % 360}, 60%, 50%), hsl(${(review.reviewer_name.charCodeAt(0) * 47 + 30) % 360}, 60%, 40%))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8125rem", fontWeight: 700, color: "#fff",
                  }}>
                    {getInitials(review.reviewer_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.375rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{review.reviewer_name}</span>
                        <div style={{ display: "flex", gap: "1px" }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={13} fill={s <= review.star_rating ? "#fbbf24" : "transparent"} color={s <= review.star_rating ? "#fbbf24" : "var(--text-muted)"} />
                          ))}
                        </div>
                        {review.sentiment && (
                          <span className={`sentiment-${review.sentiment}`} style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: 500 }}>
                            {review.sentiment}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className={status.className} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.1875rem 0.5rem", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: 500 }}>
                          <StatusIcon size={11} />
                          {status.label}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {timeAgo(review.review_created_at)}
                        </span>
                      </div>
                    </div>

                    {review.review_text ? (
                      <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                        &ldquo;{review.review_text}&rdquo;
                      </p>
                    ) : (
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.75rem" }}>
                        ★ Star-only review (no text)
                      </p>
                    )}

                    {review.ai_reply && (
                      <div style={{ background: "rgba(34, 197, 94, 0.05)", borderLeft: "3px solid var(--primary)", borderRadius: "0 8px 8px 0", padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem", fontSize: "0.6875rem", color: "var(--primary)", fontWeight: 600 }}>
                          <Bot size={12} /> AI Reply
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                          {review.ai_reply}
                        </p>
                      </div>
                    )}

                    {(review.reply_status === "pending" || review.reply_status === "failed") && !review.ai_reply && (
                      <button
                        onClick={() => handleGenerateReply(review.id)}
                        disabled={generatingId === review.id}
                        className="btn-primary"
                        style={{ marginTop: "0.5rem", padding: "0.4375rem 1rem", fontSize: "0.8125rem" }}
                      >
                        {generatingId === review.id ? (
                          <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                        ) : (
                          <><Sparkles size={14} /> Generate AI Reply</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
