import { createClient } from "@/lib/supabase/server";
import { generateReply } from "@/lib/ai/reply-engine";
import { NextResponse } from "next/server";
import type { AIReplyRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Get reply settings
    const { data: settings } = await supabase
      .from("reply_settings")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    // Build AI request
    const aiRequest: AIReplyRequest = {
      reviewerName: (review as Record<string, unknown>).reviewer_name as string || "Customer",
      starRating: (review as Record<string, unknown>).star_rating as number,
      reviewText: (review as Record<string, unknown>).review_text as string | null,
      businessName: (settings as Record<string, unknown>)?.business_name as string || "Our Business",
      businessType: (settings as Record<string, unknown>)?.business_type as string || "business",
      businessLocation: (settings as Record<string, unknown>)?.business_location as string || "",
      businessContext: (settings as Record<string, unknown>)?.business_context as string || "",
      customInstructions: (settings as Record<string, unknown>)?.custom_instructions as string || "",
      tone: (settings as Record<string, unknown>)?.tone as string || "professional",
    };

    // Update status to generating
    await supabase
      .from("reviews")
      .update({ reply_status: "generating" })
      .eq("id", reviewId);

    // Generate reply
    const result = await generateReply(aiRequest);

    // Update review with AI reply
    await supabase
      .from("reviews")
      .update({
        ai_reply: result.reply,
        ai_reply_generated_at: new Date().toISOString(),
        reply_status: "generated",
        sentiment: result.sentiment,
        sentiment_score: result.sentimentScore,
      })
      .eq("id", reviewId);

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "review.reply_generated",
      description: `AI reply generated for ${(review as Record<string, unknown>).reviewer_name}'s ${(review as Record<string, unknown>).star_rating}-star review`,
      details: { review_id: reviewId, sentiment: result.sentiment },
    });

    return NextResponse.json({
      reply: result.reply,
      sentiment: result.sentiment,
      sentimentScore: result.sentimentScore,
    });
  } catch (error) {
    console.error("[API] Generate reply error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate reply" },
      { status: 500 }
    );
  }
}
