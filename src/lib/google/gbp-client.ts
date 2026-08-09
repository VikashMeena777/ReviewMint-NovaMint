/**
 * Google Business Profile API client
 * Handles token refresh, review fetching, and reply posting
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

/**
 * Refresh an expired Google OAuth access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[GBP] Token refresh failed:", error);
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Google doesn't always return a new refresh token
    expires_in: data.expires_in,
  };
}

/**
 * Get a valid access token, refreshing if expired
 */
export async function getValidToken(connection: {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}): Promise<{ accessToken: string; refreshed: boolean; expiresAt?: string }> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return { accessToken: connection.access_token, refreshed: false };
  }

  // Token expired or about to expire — refresh it
  const tokens = await refreshAccessToken(connection.refresh_token);
  const newExpiresAt = new Date(
    Date.now() + (tokens.expires_in || 3600) * 1000
  ).toISOString();

  return {
    accessToken: tokens.access_token,
    refreshed: true,
    expiresAt: newExpiresAt,
  };
}

export interface GBPReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: string; // "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE"
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
  name: string; // Full resource name
}

const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

/**
 * Fetch reviews for a Google Business Profile location
 */
export async function fetchReviews(
  accessToken: string,
  accountName: string,
  locationId: string,
  pageSize = 50,
  pageToken?: string
): Promise<{ reviews: GBPReview[]; nextPageToken?: string; totalReviewCount?: number }> {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (pageToken) params.set("pageToken", pageToken);

  // The GBP API v1 uses the account name to list reviews
  const url = `https://mybusiness.googleapis.com/v4/${locationId}/reviews?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[GBP] Fetch reviews failed:", error);
    throw new Error(`Failed to fetch reviews: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    reviews: (data.reviews || []) as GBPReview[],
    nextPageToken: data.nextPageToken,
    totalReviewCount: data.totalReviewCount,
  };
}

/**
 * Post a reply to a Google review
 */
export async function postReply(
  accessToken: string,
  reviewName: string, // Full resource name e.g. accounts/123/locations/456/reviews/789
  replyText: string
): Promise<{ success: boolean; error?: string }> {
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment: replyText }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[GBP] Post reply failed:", error);
    return {
      success: false,
      error: error.error?.message || response.statusText,
    };
  }

  return { success: true };
}

/**
 * Convert GBP star rating string to number
 */
export function starRatingToNumber(rating: string): number {
  return STAR_MAP[rating] || 0;
}

/**
 * Delete a reply from a Google review
 */
export async function deleteReply(
  accessToken: string,
  reviewName: string
): Promise<{ success: boolean; error?: string }> {
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error: error.error?.message || response.statusText,
    };
  }

  return { success: true };
}
