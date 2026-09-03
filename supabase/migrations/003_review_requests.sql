-- ============================================
-- ReviewMint — Review Request System Migration
-- ============================================

-- 1. Add place_id and review_url to google_connections
ALTER TABLE google_connections 
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS review_url text;

-- 2. Add wallet fields to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS wallet_balance int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credits_purchased int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credits_used int DEFAULT 0;

-- 3. WhatsApp connections (Embedded Signup credentials)
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  waba_id             text NOT NULL,
  phone_number_id     text NOT NULL,
  access_token        text NOT NULL,
  display_phone       text,
  template_status     text DEFAULT 'pending' CHECK (template_status IN ('pending', 'approved', 'rejected')),
  template_en_id      text,
  template_hi_id      text,
  is_active           boolean DEFAULT true,
  verified_at         timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_connections_user_policy" ON whatsapp_connections
  FOR ALL USING (auth.uid() = user_id);

-- 4. Review requests
CREATE TABLE IF NOT EXISTS review_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id   uuid REFERENCES google_connections(id) ON DELETE CASCADE,
  customer_name   text NOT NULL,
  customer_phone  text,
  customer_email  text,
  visit_date      date DEFAULT CURRENT_DATE,
  visit_notes     text,
  channel         text DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'both')),
  send_mode       text DEFAULT 'manual' CHECK (send_mode IN ('manual', 'auto')),
  language        text DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  message_text    text NOT NULL,
  review_link     text NOT NULL,
  status          text DEFAULT 'pending' CHECK (status IN (
    'pending', 'scheduled', 'sent', 'delivered', 'read', 'failed', 'skipped'
  )),
  wa_message_id   text,
  credits_used    int DEFAULT 0,
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  read_at         timestamptz,
  failed_reason   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rr_user ON review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rr_status ON review_requests(status);
CREATE INDEX IF NOT EXISTS idx_rr_scheduled ON review_requests(scheduled_for) WHERE status = 'scheduled';

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_requests_user_policy" ON review_requests
  FOR ALL USING (auth.uid() = user_id);

-- 5. Credit transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type            text NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  amount          int NOT NULL,
  balance_after   int NOT NULL,
  cashfree_order_id   text,
  payment_amount_inr  numeric(10,2),
  review_request_id   uuid REFERENCES review_requests(id),
  description     text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_user ON credit_transactions(user_id);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_transactions_user_policy" ON credit_transactions
  FOR ALL USING (auth.uid() = user_id);

-- 6. Campaign settings
CREATE TABLE IF NOT EXISTS campaign_settings (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id   uuid REFERENCES google_connections(id) ON DELETE CASCADE,
  google_place_id   text,
  google_review_url text,
  default_mode      text DEFAULT 'manual',
  default_channel   text DEFAULT 'whatsapp',
  default_language  text DEFAULT 'en',
  templates         jsonb DEFAULT '{
    "en": {
      "whatsapp": "Hi {name}, thank you for visiting {business}! We hope you had a great experience. Could you take a moment to leave us a Google review? {review_link} Thank you! - {business}",
      "email_subject": "How was your visit to {business}?",
      "email_body": "Hi {name}, Thank you for visiting {business}! We would appreciate a quick Google review: {review_link} Thank you! {business}"
    },
    "hi": {
      "whatsapp": "नमस्ते {name} जी, {business} में आने के लिए धन्यवाद! क्या आप हमें Google पर एक review दे सकते हैं? इससे हमें बहुत मदद मिलती है। {review_link} धन्यवाद! - {business}",
      "email_subject": "{business} में आपका अनुभव कैसा रहा?",
      "email_body": "नमस्ते {name} जी, {business} में आने के लिए धन्यवाद! कृपया हमें Google पर एक review दें: {review_link} धन्यवाद! {business}"
    }
  }'::jsonb,
  delay_minutes     int DEFAULT 120,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(user_id, connection_id)
);

ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_settings_user_policy" ON campaign_settings
  FOR ALL USING (auth.uid() = user_id);

-- 7. Pricing config (admin-only, no RLS)
CREATE TABLE IF NOT EXISTS pricing_config (
  id                  text PRIMARY KEY DEFAULT 'default',
  meta_base_rate_inr  numeric(10,4) DEFAULT 0.70,
  markup_multiplier   numeric(5,2) DEFAULT 2.0,
  bulk_discount_tiers jsonb DEFAULT '[
    {"min_credits": 50, "discount": 0},
    {"min_credits": 200, "discount": 0.10},
    {"min_credits": 500, "discount": 0.20},
    {"min_credits": 2000, "discount": 0.30}
  ]'::jsonb,
  updated_at          timestamptz DEFAULT now()
);

INSERT INTO pricing_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
