"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Link2,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import type { GoogleConnection } from "@/types";
import { timeAgo } from "@/lib/utils/helpers";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("google_connections")
      .select("*")
      .eq("user_id", user.id)
      .order("connected_at", { ascending: false });

    if (data) setConnections(data as GoogleConnection[]);
    setLoading(false);
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const response = await fetch("/api/google/auth-url");
      if (!response.ok) throw new Error("Failed to get auth URL");
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to start Google connection. Make sure Google credentials are configured.");
      setConnecting(false);
    }
  }

  async function handleDisconnect(id: string) {
    const confirmed = window.confirm("Are you sure you want to disconnect this profile?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("google_connections")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Failed to disconnect");
      return;
    }

    setConnections((prev) => prev.filter((c) => c.id !== id));
    toast.success("Profile disconnected");
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="heading-section" style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Connections</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Manage your Google Business Profile connections</p>
        </div>
        <button onClick={handleConnect} disabled={connecting} className="btn-primary">
          {connecting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
          Connect Profile
        </button>
      </motion.div>

      {/* Info Box */}
      <motion.div variants={fadeUp} custom={1} className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", borderLeft: "3px solid #3b82f6" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <AlertTriangle size={18} style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-primary)" }}>How it works:</strong> Click &ldquo;Connect Profile&rdquo; to link your Google Business Profile via OAuth.
            ReviewMint will then automatically poll your reviews and generate AI replies. You need a Google Cloud project with the Business Profile API enabled.
          </div>
        </div>
      </motion.div>

      {/* Connections List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2].map((i) => (
            <div key={i} className="animate-shimmer" style={{ height: "100px", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <motion.div variants={fadeUp} custom={2} className="glass-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Link2 size={28} style={{ color: "#3b82f6" }} />
          </div>
          <h3 className="heading-section" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No Profiles Connected</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            Connect your Google Business Profile to start auto-responding to reviews. You&apos;ll be redirected to Google to authorize access.
          </p>
          <button onClick={handleConnect} disabled={connecting} className="btn-primary">
            {connecting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
            Connect Google Business Profile
          </button>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {connections.map((conn, i) => (
            <motion.div key={conn.id} variants={fadeUp} custom={i + 2} className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #4285F4, #34A853)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="22" height="22" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff" />
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff" fillOpacity="0.8" />
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#fff" fillOpacity="0.6" />
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#fff" fillOpacity="0.9" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>
                      {conn.location_name || conn.account_name || "Google Business Profile"}
                    </div>
                    {conn.location_address && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        <MapPin size={12} /> {conn.location_address}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: conn.is_active ? "var(--primary)" : "var(--text-muted)" }}>
                        {conn.is_active ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {conn.is_active ? "Active" : "Inactive"}
                      </div>
                      {conn.google_email && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{conn.google_email}</span>
                      )}
                      {conn.last_synced_at && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Synced {timeAgo(conn.last_synced_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="btn-ghost"
                    style={{ padding: "0.375rem", color: "var(--destructive)" }}
                    title="Disconnect"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
