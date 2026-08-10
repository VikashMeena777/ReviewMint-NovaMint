import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-only activity log writer. Fire-and-forget, never blocks the
 * caller and never throws into a request path.
 *
 * Presentation helpers live in `@/lib/utils/helpers`, which is safe to
 * import from client components. Keep them separate: this module pulls
 * in the server Supabase client and cannot cross that boundary.
 */
export async function logActivity(
  userId: string,
  action: string,
  description?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("activity_log").insert({
      user_id: userId,
      action,
      description: description ?? null,
      details: details ?? {},
    });
  } catch (error) {
    console.error("[Activity Log] Failed to log:", error);
  }
}
