import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getValidToken,
  fetchReviews,
  postReply,
  starRatingToNumber,
} from "@/lib/google/gbp-client";
import { generateReply } from "@/lib/ai/reply-engine";
import type { AIReplyRequest } from "@/types";

/**
 * Cron endpoint: Poll Google reviews, generate AI replies, and post them.
 * Protected by CRON_SECRET header.
 * 
 * Called by n8n workflow or GitHub Actions on a schedule (every 15 min).
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role client to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Get all active connections
    const { data: connections, error: connError } = await supabase
      .from("google_connections")
      .select("*")
      .eq("is_active", true);

    if (connError || !connections) {
      console.error("[Cron] Failed to fetch connections:", connError);
      return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }

    let totalNewReviews = 0;
    let totalRepliesGenerated = 0;
    let totalRepliesPosted = 0;
    const errors: string[] = [];

    for (const connection of connections) {
      try {
        // 1. Get valid access token (refresh if needed)
        const tokenResult = await getValidToken({
          access_token: connection.access_token,
          refresh_token: connection.refresh_token,
          token_expires_at: connection.token_expires_at,
        });

        // Update token if refreshed
        if (tokenResult.refreshed) {
          await supabase
            .from("google_connections")
            .update({
              access_token: tokenResult.accessToken,
              token_expires_at: tokenResult.expiresAt,
            })
            .eq("id", connection.id);
        }

        // 2. Fetch reviews from GBP
        if (!connection.location_id) {
          console.warn(`[Cron] Connection ${connection.id} has no location_id, skipping`);
          continue;
        }

        const { reviews: gbpReviews } = await fetchReviews(
          tokenResult.accessToken,
          connection.account_name,
          connection.location_id
        );

        // 3. Find new reviews (not yet in our DB)
        for (const gbpReview of gbpReviews) {
          // Check if already exists
          const { data: existing } = await supabase
            .from("reviews")
            .select("id")
            .eq("google_review_id", gbpReview.reviewId)
            .limit(1)
            .single();

          if (existing) continue; // Already processed

          const starRating = starRatingToNumber(gbpReview.starRating);

          // Insert new review
          const { data: newReview, error: insertError } = await supabase
            .from("reviews")
            .insert({
              user_id: connection.user_id,
              connection_id: connection.id,
              google_review_id: gbpReview.reviewId,
              google_review_name: gbpReview.name,
              reviewer_name: gbpReview.reviewer.displayName || "Customer",
              reviewer_photo_url: gbpReview.reviewer.profilePhotoUrl,
              star_rating: starRating,
              review_text: gbpReview.comment || null,
              review_created_at: gbpReview.createTime,
              reply_status: gbpReview.reviewReply ? "posted" : "pending",
              existing_reply: gbpReview.reviewReply?.comment || null,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[Cron] Failed to insert review:`, insertError);
            errors.push(`Insert review: ${insertError.message}`);
            continue;
          }

          totalNewReviews++;

          // Skip if already has a reply on Google
          if (gbpReview.reviewReply) continue;

          // 4. Get reply settings for this user
          const { data: settings } = await supabase
            .from("reply_settings")
            .select("*")
            .eq("user_id", connection.user_id)
            .limit(1)
            .single();

          // Check if auto-reply is enabled
          if (!(settings as Record<string, unknown>)?.auto_reply_enabled) continue;

          // Check if this star rating is excluded
          const excludeRatings = ((settings as Record<string, unknown>)?.exclude_star_ratings as number[]) || [];
          if (excludeRatings.includes(starRating)) continue;

          // 5. Generate AI reply
          try {
            const aiRequest: AIReplyRequest = {
              reviewerName: gbpReview.reviewer.displayName || "Customer",
              starRating,
              reviewText: gbpReview.comment || null,
              businessName: (settings as Record<string, unknown>)?.business_name as string || connection.location_name || "Our Business",
              businessType: (settings as Record<string, unknown>)?.business_type as string || "business",
              businessLocation: (settings as Record<string, unknown>)?.business_location as string || connection.location_address || "",
              businessContext: (settings as Record<string, unknown>)?.business_context as string || "",
              customInstructions: (settings as Record<string, unknown>)?.custom_instructions as string || "",
              tone: (settings as Record<string, unknown>)?.tone as string || "professional",
            };

            await supabase
              .from("reviews")
              .update({ reply_status: "generating" })
              .eq("id", (newReview as Record<string, unknown>).id);

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
              .eq("id", (newReview as Record<string, unknown>).id);

            totalRepliesGenerated++;

            // 6. Check delay before posting
            const delayMinutes = ((settings as Record<string, unknown>)?.reply_delay_minutes as number) || 0;

            if (delayMinutes === 0) {
              // Post immediately
              const postResult = await postReply(
                tokenResult.accessToken,
                gbpReview.name,
                result.reply
              );

              if (postResult.success) {
                await supabase
                  .from("reviews")
                  .update({
                    reply_status: "posted",
                    reply_posted_at: new Date().toISOString(),
                  })
                  .eq("id", (newReview as Record<string, unknown>).id);

                totalRepliesPosted++;
              } else {
                await supabase
                  .from("reviews")
                  .update({ reply_status: "failed" })
                  .eq("id", (newReview as Record<string, unknown>).id);

                errors.push(`Post reply: ${postResult.error}`);
              }
            }
            // If delay > 0, the reply stays in "generated" status
            // and gets posted by a separate delayed-post cron
          } catch (aiError) {
            console.error(`[Cron] AI generation failed:`, aiError);
            await supabase
              .from("reviews")
              .update({ reply_status: "failed" })
              .eq("id", (newReview as Record<string, unknown>).id);

            errors.push(
              `AI generation: ${aiError instanceof Error ? aiError.message : "Unknown"}`
            );
          }
        }

        // Update last synced timestamp
        await supabase
          .from("google_connections")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", connection.id);
      } catch (connError) {
        const msg = connError instanceof Error ? connError.message : "Unknown connection error";
        console.error(`[Cron] Error processing connection ${connection.id}:`, msg);
        errors.push(`Connection ${connection.id}: ${msg}`);
      }
    }

    // Log activity
    if (totalNewReviews > 0) {
      await supabase.from("activity_log").insert({
        user_id: connections[0]?.user_id,
        action: "cron.review_poll",
        description: `Polled ${totalNewReviews} new reviews, generated ${totalRepliesGenerated} replies, posted ${totalRepliesPosted}`,
        details: { totalNewReviews, totalRepliesGenerated, totalRepliesPosted, errors },
      });
    }

    return NextResponse.json({
      success: true,
      connections: connections.length,
      newReviews: totalNewReviews,
      repliesGenerated: totalRepliesGenerated,
      repliesPosted: totalRepliesPosted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Cron] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
