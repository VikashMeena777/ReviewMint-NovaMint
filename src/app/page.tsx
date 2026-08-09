"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Zap,
  Shield,
  MessageSquareText,
  ArrowRight,
  Check,
  Globe,
  Bot,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

/* ── Animations ─────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── Demo Data ──────────────────────────────────────────────────────── */
const demoScenarios = [
  {
    id: 1,
    author: "Somara Reddy",
    initials: "SR",
    rating: 5,
    business: "WorkSpace HSR, Bangalore",
    text: "Absolutely love working here! High-speed internet never drops, coffee is top tier, and community management is super helpful.",
    sentiment: "Positive",
    aiReply:
      "Hi Somara! Thank you for the wonderful 5-star review. We're glad you're enjoying our high-speed WiFi and coffee. Our community managers love having you. See you at networking Friday!",
  },
  {
    id: 2,
    author: "Vikram Malhotra",
    initials: "VM",
    rating: 2,
    business: "Apex Fitness, Mumbai",
    text: "AC was struggling on the 2nd floor during peak hours yesterday. Felt very suffocating during workout.",
    sentiment: "Attention",
    aiReply:
      "Hi Vikram, we sincerely apologize for the AC issue. We brought in technicians immediately and installed additional cooling units today. Please visit us again — we'd love to offer a complimentary smoothie pass.",
  },
  {
    id: 3,
    author: "Ananya Roy",
    initials: "AR",
    rating: 4,
    business: "Savoury Bistro, Indiranagar",
    text: "Food was fantastic! The truffle pasta is to die for. Just took about 25 mins to get seated on Saturday night.",
    sentiment: "Positive",
    aiReply:
      "Hi Ananya! Thanks for visiting. We're glad you loved our signature truffle pasta. Saturday evenings get busy, so we recommend reserving on our website next time. Hope to see you again soon!",
  },
];

/* ── Features ───────────────────────────────────────────────────────── */
const features = [
  {
    icon: Bot,
    title: "Context-Aware AI Replies",
    desc: "Powered by Groq and Llama 3.3 70B. Reads every detail — rating, tone, specifics — to write human-grade, personalized responses in under 2 seconds.",
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))",
  },
  {
    icon: Zap,
    title: "24/7 Autopilot",
    desc: "Direct Google Business Profile API integration polls and posts replies automatically, round the clock.",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.02))",
  },
  {
    icon: Shield,
    title: "Negative Review Guard",
    desc: "Catches low ratings instantly, generating empathetic resolution replies and sending immediate private alerts.",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.02))",
  },
  {
    icon: Globe,
    title: "Multi-Language Detection",
    desc: "Replies natively in Hindi, Kannada, Tamil, English, Spanish, French, German, and 100+ other languages.",
    gradient: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.02))",
  },
];

/* ── Pricing ────────────────────────────────────────────────────────── */
const plans = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    desc: "For single-location local businesses.",
    features: [
      "1 Google Business location",
      "Unlimited AI replies",
      "Real-time Google API sync",
      "Custom brand voice",
      "Email notifications",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "/month",
    desc: "For growing multi-branch businesses.",
    features: [
      "Up to 3 locations",
      "Priority AI queue",
      "WhatsApp & SMS alerts",
      "Custom tone & rules engine",
      "Negative review workflow",
      "Weekly sentiment reports",
      "n8n integration support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "₹4,999",
    period: "/month",
    desc: "For agencies and franchises.",
    features: [
      "Up to 10 locations",
      "White-label reports",
      "Full REST API & webhooks",
      "Custom AI fine-tuning",
      "Dedicated account manager",
      "99.9% uptime SLA",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

/* ── FAQ ─────────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "Do I need Google Cloud API approval?",
    a: "No. ReviewMint connects via Google Business Profile API OAuth test mode, allowing immediate setup without waiting for Google verification.",
  },
  {
    q: "How does ReviewMint sound human?",
    a: "No templates. Our AI analyzes exact words, rating, tone, and specific details to craft bespoke responses matching your brand voice.",
  },
  {
    q: "What about negative reviews?",
    a: "ReviewMint uses a dedicated empathetic protocol. It acknowledges concerns, explains corrective steps, and provides contact details for offline resolution.",
  },
  {
    q: "Can I review replies before posting?",
    a: "Yes. Toggle between Full Autopilot (instant posting) and Approval Mode (AI generates drafts, you approve with one click).",
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [activeScenario, setActiveScenario] = useState(demoScenarios[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleScenarioChange = (scenario: (typeof demoScenarios)[0]) => {
    setIsGenerating(true);
    setActiveScenario(scenario);
    setTimeout(() => setIsGenerating(false), 400);
  };

  /* ── Shared container style ─────────────────────────────────────── */
  const container: React.CSSProperties = {
    maxWidth: 1200,
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: 24,
    paddingRight: 24,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-canvas)" }}>

      {/* ═══ NAVIGATION ═══════════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8, 9, 10, 0.85)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: "1px solid var(--border-subtle)",
          height: 64,
        }}
      >
        <div
          style={{
            ...container,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <MessageSquareText size={17} color="#fff" />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg-primary)" }}>
              Review<span style={{ color: "var(--accent)" }}>Mint</span>
            </span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Features", "Demo", "Pricing", "FAQ"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                style={{
                  fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg-tertiary)",
                  textDecoration: "none", transition: "color 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "var(--fg-primary)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "var(--fg-tertiary)")}
              >
                {label}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" className="btn-ghost">Sign In</Link>
            <Link href="/signup" className="btn-primary">
              Start Free Trial <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ═══ HERO SECTION ═════════════════════════════════════════════
             Centered layout with a subtle radial glow behind headline.
             Generous 140px top padding, 100px bottom.
        ═══════════════════════════════════════════════════════════════ */}
        <section
          style={{
            paddingTop: 140,
            paddingBottom: 100,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              top: -200,
              left: "50%",
              transform: "translateX(-50%)",
              width: 900,
              height: 600,
              background: "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            style={{ ...container, position: "relative", zIndex: 1, textAlign: "center" }}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 16px 6px 12px",
                  borderRadius: 9999,
                  border: "1px solid var(--border-default)",
                  background: "var(--surface-1)",
                  fontSize: "0.75rem", fontWeight: 500, color: "var(--fg-tertiary)",
                }}
              >
                <span className="pulse-dot" />
                AI-Powered Review Management
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                color: "var(--fg-primary)",
                maxWidth: 800,
                margin: "0 auto 24px",
              }}
            >
              Every Google Review,{" "}
              <span style={{ color: "var(--accent)" }}>Answered Instantly</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              style={{
                fontSize: "1.125rem",
                fontWeight: 400,
                lineHeight: 1.7,
                color: "var(--fg-tertiary)",
                maxWidth: 560,
                margin: "0 auto 40px",
              }}
            >
              AI-powered responses posted directly to your Google Business Profile.
              Protect your reputation while you sleep.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 48 }}
            >
              <Link
                href="/signup"
                className="btn-primary"
                style={{ padding: "14px 32px", fontSize: "0.9375rem" }}
              >
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="btn-ghost"
                style={{ padding: "14px 32px", fontSize: "0.9375rem" }}
              >
                See How It Works
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap",
                fontSize: "0.8125rem", color: "var(--fg-quaternary)",
              }}
            >
              {["No credit card required", "2-minute setup", "Official Google API"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ METRICS STRIP ════════════════════════════════════════════ */}
        <section
          style={{
            padding: "48px 0",
            borderTop: "1px solid var(--border-subtle)",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-panel)",
          }}
        >
          <div
            style={{
              ...container,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 32,
              textAlign: "center",
            }}
          >
            {[
              { value: "< 2s", label: "Reply Speed", icon: Zap },
              { value: "100%", label: "API Compliant", icon: Shield },
              { value: "24/7", label: "Autonomous", icon: RefreshCw },
              { value: "30+", label: "Languages", icon: Globe },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "var(--accent-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px", color: "var(--accent)",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.03em",
                      color: "var(--fg-primary)",
                      fontFamily: "var(--font-mono), monospace",
                      marginBottom: 4,
                    }}
                  >
                    {m.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem", fontWeight: 500, color: "var(--fg-quaternary)",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ DEMO WIDGET ══════════════════════════════════════════════ */}
        <section
          id="demo"
          style={{
            paddingTop: 120,
            paddingBottom: 120,
            position: "relative",
          }}
        >
          {/* Subtle glow */}
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 700,
              height: 500,
              background: "radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ ...container, position: "relative", zIndex: 1 }}>
            {/* Section heading */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              style={{ textAlign: "center", marginBottom: 48 }}
            >
              <motion.h2
                variants={fadeUp}
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700, letterSpacing: "-0.03em",
                  color: "var(--fg-primary)", marginBottom: 12,
                }}
              >
                See It In Action
              </motion.h2>
              <motion.p
                variants={fadeUp}
                style={{ fontSize: "1rem", color: "var(--fg-tertiary)", maxWidth: 480, margin: "0 auto" }}
              >
                Click a review type below to watch AI craft a perfect response in real-time.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-default)",
                borderRadius: 16,
                padding: 32,
                maxWidth: 960,
                margin: "0 auto",
              }}
            >
              {/* Demo header */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 16,
                  paddingBottom: 24,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: 2 }}>
                    Interactive Demo
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--fg-quaternary)" }}>
                    See how ReviewMint handles real customer reviews
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {demoScenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleScenarioChange(s)}
                      className={activeScenario.id === s.id ? "btn-primary" : "btn-ghost"}
                      style={{ padding: "8px 16px", fontSize: "0.8125rem" }}
                    >
                      {s.rating}★ Review
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo content */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  paddingTop: 24,
                }}
              >
                {/* Incoming review */}
                <div
                  style={{
                    background: "var(--bg-canvas)",
                    borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "var(--surface-3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-primary)",
                        }}
                      >
                        {activeScenario.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg-primary)" }}>
                          {activeScenario.author}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--fg-quaternary)" }}>
                          {activeScenario.business}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < activeScenario.rating ? "#fbbf24" : "none"}
                          color={i < activeScenario.rating ? "#fbbf24" : "var(--fg-quaternary)"}
                        />
                      ))}
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "0.9375rem", color: "var(--fg-secondary)",
                      lineHeight: 1.7, fontStyle: "italic",
                    }}
                  >
                    &ldquo;{activeScenario.text}&rdquo;
                  </p>
                </div>

                {/* AI reply */}
                <div
                  style={{
                    background: "var(--bg-canvas)",
                    borderRadius: 12,
                    border: `1px solid ${activeScenario.rating <= 2 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.15)"}`,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: "0.875rem", fontWeight: 600, color: "var(--accent)",
                      }}
                    >
                      <Bot size={16} />
                      AI Reply
                    </div>
                    <span
                      style={{
                        fontSize: "0.6875rem", fontWeight: 600,
                        padding: "3px 10px", borderRadius: 9999,
                        background: activeScenario.sentiment === "Attention" ? "rgba(245,158,11,0.1)" : "var(--accent-muted)",
                        color: activeScenario.sentiment === "Attention" ? "var(--warning)" : "var(--accent)",
                      }}
                    >
                      {activeScenario.sentiment}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          justifyContent: "center",
                          padding: "40px 0",
                          color: "var(--fg-tertiary)", fontSize: "0.875rem",
                        }}
                      >
                        <RefreshCw size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
                        Analyzing review context...
                      </motion.div>
                    ) : (
                      <motion.p
                        key={`reply-${activeScenario.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.35 }}
                        style={{
                          fontSize: "0.9375rem", color: "var(--fg-secondary)", lineHeight: 1.7,
                        }}
                      >
                        {activeScenario.aiReply}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      marginTop: 16, paddingTop: 16,
                      borderTop: "1px solid var(--border-subtle)",
                      fontSize: "0.75rem", color: "var(--fg-quaternary)",
                    }}
                  >
                    <CheckCircle2 size={12} style={{ color: "var(--accent)" }} />
                    Auto-posted to Google in 1.4s
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ FEATURES (BENTO GRID) ════════════════════════════════════ */}
        <section
          id="features"
          style={{
            paddingTop: 120,
            paddingBottom: 120,
            background: "var(--bg-panel)",
            borderTop: "1px solid var(--border-subtle)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            style={container}
          >
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 64 }}>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700, letterSpacing: "-0.03em",
                  color: "var(--fg-primary)", marginBottom: 12,
                }}
              >
                Built for Reputation Growth
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--fg-tertiary)", maxWidth: 520, margin: "0 auto" }}>
                Google ranks active Business Profiles higher. ReviewMint keeps yours engaged around the clock.
              </p>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 20,
                maxWidth: 960,
                margin: "0 auto",
              }}
            >
              {features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    custom={idx}
                    style={{
                      background: item.gradient,
                      border: "1px solid var(--border-default)",
                      borderRadius: 16,
                      padding: 32,
                      transition: "border-color 0.2s, transform 0.2s",
                    }}
                    whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 20,
                        color: idx === 0 ? "var(--accent)" : "var(--fg-secondary)",
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3
                      style={{
                        fontSize: "1.125rem", fontWeight: 600,
                        color: "var(--fg-primary)", marginBottom: 8,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--fg-tertiary)", lineHeight: 1.7 }}>
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ═══ PRICING ══════════════════════════════════════════════════ */}
        <section
          id="pricing"
          style={{
            paddingTop: 120,
            paddingBottom: 120,
            position: "relative",
          }}
        >
          {/* Subtle glow */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 800,
              height: 400,
              background: "radial-gradient(ellipse at center, rgba(16,185,129,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            style={{ ...container, position: "relative", zIndex: 1 }}
          >
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 64 }}>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700, letterSpacing: "-0.03em",
                  color: "var(--fg-primary)", marginBottom: 12,
                }}
              >
                Simple, Transparent Pricing
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--fg-tertiary)" }}>
                14-day free trial on every plan. No credit card required.
              </p>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                maxWidth: 1000,
                margin: "0 auto",
              }}
            >
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  custom={idx}
                  style={{
                    background: plan.popular
                      ? "linear-gradient(180deg, rgba(16,185,129,0.06) 0%, var(--surface-1) 100%)"
                      : "var(--surface-1)",
                    border: `1px solid ${plan.popular ? "var(--accent)" : "var(--border-default)"}`,
                    borderRadius: 16,
                    padding: 32,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    transition: "border-color 0.2s",
                  }}
                >
                  {plan.popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "4px 16px",
                        background: "var(--accent)",
                        color: "#fff",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderRadius: 9999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3
                      style={{
                        fontSize: "1.25rem", fontWeight: 600,
                        color: "var(--fg-primary)", marginBottom: 4,
                      }}
                    >
                      {plan.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8125rem", color: "var(--fg-quaternary)",
                        marginBottom: 24,
                      }}
                    >
                      {plan.desc}
                    </p>

                    <div
                      style={{
                        display: "flex", alignItems: "baseline", gap: 4,
                        marginBottom: 28,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "2.5rem", fontWeight: 700,
                          letterSpacing: "-0.03em", color: "var(--fg-primary)",
                        }}
                      >
                        {plan.price}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "var(--fg-quaternary)" }}>
                        {plan.period}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                      {plan.features.map((f) => (
                        <div
                          key={f}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 10,
                            fontSize: "0.875rem", color: "var(--fg-secondary)",
                          }}
                        >
                          <Check
                            size={16}
                            style={{
                              color: plan.popular ? "var(--accent)" : "var(--fg-quaternary)",
                              flexShrink: 0, marginTop: 2,
                            }}
                          />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/signup"
                    className={plan.popular ? "btn-primary" : "btn-ghost"}
                    style={{
                      textAlign: "center",
                      padding: "14px 16px",
                      width: "100%",
                      fontSize: "0.9375rem",
                    }}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ FAQ ═══════════════════════════════════════════════════════ */}
        <section
          id="faq"
          style={{
            paddingTop: 100,
            paddingBottom: 100,
            background: "var(--bg-panel)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            style={{ ...container, maxWidth: 720 }}
          >
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 48 }}>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700, letterSpacing: "-0.03em",
                  color: "var(--fg-primary)", marginBottom: 12,
                }}
              >
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {faqs.map((faq, idx) => (
                <motion.div
                  key={faq.q}
                  variants={fadeUp}
                  custom={idx}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: "20px 24px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      fontSize: "0.9375rem", fontWeight: 500, color: "var(--fg-primary)",
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        color: "var(--fg-quaternary)",
                        transition: "transform 0.25s ease",
                        transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                        flexShrink: 0,
                        marginLeft: 16,
                      }}
                    />
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: "1px solid var(--border-subtle)",
                            fontSize: "0.875rem",
                            color: "var(--fg-tertiary)",
                            lineHeight: 1.7,
                          }}
                        >
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ CTA BANNER ═══════════════════════════════════════════════ */}
        <section
          style={{
            paddingTop: 100,
            paddingBottom: 100,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600,
              height: 400,
              background: "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ ...container, position: "relative", zIndex: 1, textAlign: "center" }}>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700, letterSpacing: "-0.03em",
                color: "var(--fg-primary)", marginBottom: 16,
              }}
            >
              Ready to Automate Your Reviews?
            </h2>
            <p
              style={{
                fontSize: "1rem", color: "var(--fg-tertiary)",
                maxWidth: 480, margin: "0 auto 40px",
              }}
            >
              Join hundreds of businesses that save hours every week with AI-powered review responses.
            </p>
            <Link
              href="/signup"
              className="btn-primary"
              style={{ padding: "16px 40px", fontSize: "1rem" }}
            >
              Start Your Free 14-Day Trial <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            ...container,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <MessageSquareText size={13} color="#fff" />
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg-primary)" }}>
              ReviewMint
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--fg-quaternary)" }}>
            &copy; {new Date().getFullYear()} ReviewMint. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
