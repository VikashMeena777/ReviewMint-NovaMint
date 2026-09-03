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
  wallet_balance: number;
  total_credits_purchased: number;
  total_credits_used: number;
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
  place_id: string | null;
  review_url: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  connected_at: string;
  updated_at: string;
}

// ─── WhatsApp Connection ─────────────────────
export type TemplateStatus = "pending" | "approved" | "rejected";

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  waba_id: string;
  phone_number_id: string;
  access_token: string;
  display_phone: string | null;
  template_status: TemplateStatus;
  template_en_id: string | null;
  template_hi_id: string | null;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Review Request ──────────────────────────
export type SendMode = "manual" | "auto";
export type Channel = "whatsapp" | "email" | "both";
export type Language = "en" | "hi";
export type RequestStatus =
  | "pending"
  | "scheduled"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped";

export interface ReviewRequest {
  id: string;
  user_id: string;
  connection_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  visit_date: string;
  visit_notes: string | null;
  channel: Channel;
  send_mode: SendMode;
  language: Language;
  message_text: string;
  review_link: string;
  status: RequestStatus;
  wa_message_id: string | null;
  credits_used: number;
  scheduled_for: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Credit Transactions ─────────────────────
export type TransactionType = "purchase" | "usage" | "refund" | "bonus";

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  cashfree_order_id: string | null;
  payment_amount_inr: number | null;
  review_request_id: string | null;
  description: string | null;
  created_at: string;
}

// ─── Campaign Settings ───────────────────────
export interface MessageTemplates {
  en: {
    whatsapp: string;
    email_subject: string;
    email_body: string;
  };
  hi: {
    whatsapp: string;
    email_subject: string;
    email_body: string;
  };
}

export interface CampaignSettings {
  id: string;
  user_id: string;
  connection_id: string | null;
  google_place_id: string | null;
  google_review_url: string | null;
  default_mode: SendMode;
  default_channel: Channel;
  default_language: Language;
  templates: MessageTemplates;
  delay_minutes: number;
  created_at: string;
  updated_at: string;
}

// ─── Pricing Config ──────────────────────────
export interface BulkDiscountTier {
  min_credits: number;
  discount: number;
}

export interface PricingConfig {
  id: string;
  meta_base_rate_inr: number;
  markup_multiplier: number;
  bulk_discount_tiers: BulkDiscountTier[];
  updated_at: string;
}

// ─── Facebook SDK ────────────────────────────
declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string;
        autoLogAppEvents: boolean;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: { version: string };
        }
      ) => void;
    };
  }
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
