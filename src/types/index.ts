// ─── ReviewMint Type Definitions ─────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  plan: "trial" | "starter" | "pro" | "agency";
  trial_ends_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoogleConnection {
  id: string;
  user_id: string;
  google_account_id: string | null;
  google_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_name: string | null;
  location_id: string | null;
  location_name: string | null;
  location_address: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  connected_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  connection_id: string;
  google_review_id: string;
  reviewer_name: string;
  reviewer_photo_url: string | null;
  star_rating: 1 | 2 | 3 | 4 | 5;
  review_text: string | null;
  review_created_at: string;
  ai_reply: string | null;
  ai_reply_generated_at: string | null;
  reply_posted_at: string | null;
  reply_status: ReviewStatus;
  failure_reason: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_score: number | null;
  is_star_only: boolean;
  created_at: string;
  // Joined
  connection?: GoogleConnection;
}

export type ReviewStatus =
  | "pending"
  | "generating"
  | "generated"
  | "posting"
  | "posted"
  | "failed"
  | "skipped";

export interface ReplySettings {
  id: string;
  user_id: string;
  connection_id: string | null;
  auto_reply_enabled: boolean;
  tone: "professional" | "friendly" | "casual" | "enthusiastic";
  reply_delay_minutes: number;
  business_name: string | null;
  business_type: string | null;
  business_location: string | null;
  business_context: string | null;
  custom_instructions: string | null;
  exclude_star_ratings: number[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// ─── Dashboard Stats ─────────────────────────
export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  repliedCount: number;
  responseRate: number;
  pendingCount: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  ratingDistribution: Record<number, number>;
  recentReviews: Review[];
}

// ─── AI Reply ────────────────────────────────
export interface AIReplyRequest {
  reviewerName: string;
  starRating: number;
  reviewText: string | null;
  businessName: string;
  businessType: string;
  businessLocation: string;
  businessContext: string;
  customInstructions: string;
  tone: string;
}

export interface AIReplyResponse {
  reply: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
}
