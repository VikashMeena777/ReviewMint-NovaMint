"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  MessageSquareText,
  Volume2,
  Clock,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { ReplySettings } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const tones = [
  { value: "professional", label: "Professional", desc: "Formal and polished, ideal for B2B" },
  { value: "friendly", label: "Friendly", desc: "Warm and approachable, great for local businesses" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational, good for cafes & lifestyle" },
  { value: "enthusiastic", label: "Enthusiastic", desc: "High-energy and excited, perfect for entertainment" },
];

const delays = [
  { value: 0, label: "Instant" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ReplySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConnection, setHasConnection] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any connections
      const { data: connections } = await supabase
        .from("google_connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);

      setHasConnection((connections || []).length > 0);

      // Load settings
      const { data } = await supabase
        .from("reply_settings")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setSettings(data as ReplySettings);
      } else {
        // Create default settings
        setSettings({
          id: "",
          user_id: user.id,
          connection_id: null,
          auto_reply_enabled: true,
          tone: "professional",
          reply_delay_minutes: 15,
          business_name: null,
          business_type: null,
          business_location: null,
          business_context: null,
          custom_instructions: null,
          exclude_star_ratings: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);
    }
    loadSettings();
  }, [supabase]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id,
      auto_reply_enabled: settings.auto_reply_enabled,
      tone: settings.tone,
      reply_delay_minutes: settings.reply_delay_minutes,
      business_name: settings.business_name,
      business_type: settings.business_type,
      business_location: settings.business_location,
      business_context: settings.business_context,
      custom_instructions: settings.custom_instructions,
    };

    if (settings.id) {
      const { error } = await supabase.from("reply_settings").update(payload).eq("id", settings.id);
      if (error) { toast.error("Failed to save settings"); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("reply_settings").insert(payload);
      if (error) { toast.error("Failed to save settings"); setSaving(false); return; }
    }

    toast.success("Settings saved!");
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-shimmer" style={{ height: "160px", borderRadius: "var(--radius-lg)" }} />
        ))}
      </div>
    );
  }

  if (!hasConnection) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="heading-section" style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Settings</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "2rem" }}>Configure your auto-reply preferences</p>
        <div className="glass-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--primary-glow)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <SettingsIcon size={28} style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="heading-section" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Connect First</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto 1.5rem" }}>
            Connect your Google Business Profile before configuring auto-reply settings.
          </p>
          <Link href="/connections" className="btn-primary">
            Connect Google Profile <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="heading-section" style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Configure your auto-reply preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
          Save Settings
        </button>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Auto-Reply Toggle */}
        <motion.div variants={fadeUp} custom={1} className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={20} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.125rem" }}>Auto-Reply</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Automatically respond to new reviews with AI</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => s ? { ...s, auto_reply_enabled: !s.auto_reply_enabled } : s)}
              style={{
                width: "48px", height: "28px", borderRadius: "14px", border: "none", cursor: "pointer",
                background: settings?.auto_reply_enabled ? "var(--primary)" : "var(--glass-hover)",
                position: "relative", transition: "background 0.2s ease",
              }}
            >
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", background: "#fff",
                position: "absolute", top: "3px",
                left: settings?.auto_reply_enabled ? "23px" : "3px",
                transition: "left 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </button>
          </div>
        </motion.div>

        {/* Reply Tone */}
        <motion.div variants={fadeUp} custom={2} className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Volume2 size={20} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.125rem" }}>Reply Tone</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Choose how your AI replies sound</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.625rem" }}>
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setSettings(s => s ? { ...s, tone: t.value as ReplySettings["tone"] } : s)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${settings?.tone === t.value ? "var(--primary)" : "var(--border)"}`,
                  background: settings?.tone === t.value ? "var(--primary-glow)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: settings?.tone === t.value ? "var(--primary)" : "var(--text-primary)", marginBottom: "0.125rem" }}>
                  {t.label}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reply Delay */}
        <motion.div variants={fadeUp} custom={3} className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={20} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.125rem" }}>Reply Delay</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Wait before posting (so it doesn&apos;t look robotic)</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {delays.map((d) => (
              <button
                key={d.value}
                onClick={() => setSettings(s => s ? { ...s, reply_delay_minutes: d.value } : s)}
                style={{
                  padding: "0.4375rem 1rem",
                  borderRadius: "999px",
                  fontSize: "0.8125rem",
                  fontWeight: settings?.reply_delay_minutes === d.value ? 600 : 400,
                  background: settings?.reply_delay_minutes === d.value ? "var(--primary-glow)" : "var(--glass)",
                  color: settings?.reply_delay_minutes === d.value ? "var(--primary)" : "var(--text-secondary)",
                  border: `1px solid ${settings?.reply_delay_minutes === d.value ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Business Context */}
        <motion.div variants={fadeUp} custom={4} className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={20} style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.125rem" }}>Business Context</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Help AI understand your business for better replies</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                  Business Name
                </label>
                <input
                  className="input-field"
                  placeholder="e.g., Somara Coworking"
                  value={settings?.business_name || ""}
                  onChange={(e) => setSettings(s => s ? { ...s, business_name: e.target.value } : s)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                  Business Type
                </label>
                <input
                  className="input-field"
                  placeholder="e.g., coworking space"
                  value={settings?.business_type || ""}
                  onChange={(e) => setSettings(s => s ? { ...s, business_type: e.target.value } : s)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                  Location
                </label>
                <input
                  className="input-field"
                  placeholder="e.g., Bangalore, India"
                  value={settings?.business_location || ""}
                  onChange={(e) => setSettings(s => s ? { ...s, business_location: e.target.value } : s)}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Business Context (helps AI write better replies)
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="e.g., We're a premium coworking space with 100 seats, high-speed WiFi, private meeting rooms, and a coffee bar. We focus on startups and freelancers."
                value={settings?.business_context || ""}
                onChange={(e) => setSettings(s => s ? { ...s, business_context: e.target.value } : s)}
                style={{ resize: "vertical" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Custom Instructions (optional)
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="e.g., Always mention our free day pass for new visitors. Never mention competitor names."
                value={settings?.custom_instructions || ""}
                onChange={(e) => setSettings(s => s ? { ...s, custom_instructions: e.target.value } : s)}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
