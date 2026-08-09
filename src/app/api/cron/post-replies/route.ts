import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidToken, postReply } from "@/lib/google/gbp-client";

/**
 * Cron endpoint: Post delayed AI replies that are in "generated" status.
 * Checks if enough time has passed since generation based on reply_delay_minutes.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Find reviews with "generated" status that are ready to be posted
    const { data: pendingReviews, error } = await supabase
      .from("reviews")
      .select("*, google_connections(*), reply_settings!inner(*)")
      .eq("reply_status", "generated")
      .not("ai_reply", "is", null)
      .not("google_review_name", "is", null);

    if (error) {
      console.error("[Cron:PostReplies] Query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    let posted = 0;
    let skipped = 0;
    let failed = 0;

    for (const review of (pendingReviews || [])) {
      const r = review as Record<string, unknown>;
      const conn = r.google_connections as Record<string, unknown> | null;
      const settings = r.reply_settings as Record<string, unknown> | null;

      if (!conn || !settings || !(conn.is_active as boolean)) {
        skipped++;
        continue;
      }

      // Check delay
      const delayMinutes = (settings.reply_delay_minutes as number) || 0;
      const generatedAt = new Date(r.ai_reply_generated_at as string);
      const readyAt = new Date(generatedAt.getTime() + delayMinutes * 60 * 1000);

      if (new Date() < readyAt) {
        skipped++; // Not ready yet
        continue;
      }

      try {
        // Get valid token
        const tokenResult = await getValidToken({
          access_token: conn.access_token as string,
          refresh_token: conn.refresh_token as string,
          token_expires_at: conn.token_expires_at as string,
        });

        if (tokenResult.refreshed) {
          await supabase
            .from("google_connections")
            .update({
              access_token: tokenResult.accessToken,
              token_expires_at: tokenResult.expiresAt,
            })
            .eq("id", conn.id);
        }

        // Post reply to Google
        const result = await postReply(
          tokenResult.accessToken,
          r.google_review_name as string,
          r.ai_reply as string
        );

        if (result.success) {
          await supabase
            .from("reviews")
            .update({
              reply_status: "posted",
              reply_posted_at: new Date().toISOString(),
            })
            .eq("id", r.id);

          posted++;
        } else {
          await supabase
            .from("reviews")
            .update({ reply_status: "failed" })
            .eq("id", r.id);

          failed++;
        }
      } catch (err) {
        console.error(`[Cron:PostReplies] Error posting review ${r.id}:`, err);
        await supabase
          .from("reviews")
          .update({ reply_status: "failed" })
          .eq("id", r.id);

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      posted,
      skipped,
      failed,
      total: (pendingReviews || []).length,
    });
  } catch (error) {
    console.error("[Cron:PostReplies] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
