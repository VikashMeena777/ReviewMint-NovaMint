"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Link2,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import type { Profile } from "@/types";
import { daysRemaining, getInitials } from "@/lib/utils/helpers";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/reviews", icon: MessageSquareText, label: "Reviews" },
  { href: "/connections", icon: Link2, label: "Connections" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as Profile);
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  const trialDays = profile ? daysRemaining(profile.trial_ends_at) : 0;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-canvas)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-lg)",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="animate-pulse-glow"
        >
          <MessageSquareText size={20} color="#fff" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-canvas)" }}>
      {/* ─── Desktop Sidebar ───────────────────────────────────── */}
      <aside
        className="sidebar-desktop"
        style={{
          width: "240px",
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
        }}
      >
        {/* Brand */}
        <div style={{ padding: "1.25rem 1rem 1rem" }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "var(--radius-lg)",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquareText size={16} color="#fff" />
            </div>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--fg-primary)",
              }}
            >
              Review<span style={{ color: "var(--accent)" }}>Mint</span>
            </span>
          </Link>
        </div>

        {/* Trial banner */}
        {profile?.plan === "trial" && trialDays > 0 && (
          <div
            style={{
              margin: "0 0.75rem 0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-subtle)",
              border: "1px solid var(--accent-muted)",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                color: "var(--accent)",
                fontWeight: 600,
                marginBottom: "0.125rem",
              }}
            >
              <Sparkles size={12} />
              Free Trial
            </div>
            <span style={{ color: "var(--fg-tertiary)" }}>
              {trialDays} days remaining
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0 0.75rem" }}>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8125rem",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive
                        ? "var(--fg-primary)"
                        : "var(--fg-tertiary)",
                      background: isActive
                        ? "var(--surface-2)"
                        : "transparent",
                      textDecoration: "none",
                      transition:
                        "background 0.12s ease, color 0.12s ease",
                    }}
                  >
                    <item.icon
                      size={16}
                      style={{
                        color: isActive
                          ? "var(--accent)"
                          : "var(--fg-quaternary)",
                        flexShrink: 0,
                      }}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div
          style={{
            padding: "0.75rem",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.5rem 0.75rem",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--fg-primary)",
                flexShrink: 0,
              }}
            >
              {profile
                ? getInitials(profile.full_name || profile.email)
                : "?"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--fg-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {profile?.full_name || "User"}
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--fg-quaternary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {profile?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost"
            style={{
              width: "100%",
              fontSize: "0.8125rem",
              padding: "0.5rem",
              justifyContent: "center",
              gap: "0.375rem",
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header ────────────────────────────────────── */}
      <div
        className="mobile-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "56px",
          background: "rgba(8, 9, 10, 0.92)",
          backdropFilter: "blur(16px) saturate(1.2)",
          WebkitBackdropFilter: "blur(16px) saturate(1.2)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          zIndex: 50,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquareText size={14} color="#fff" />
          </div>
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--fg-primary)",
            }}
          >
            Review<span style={{ color: "var(--accent)" }}>Mint</span>
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "none",
            border: "none",
            color: "var(--fg-primary)",
            cursor: "pointer",
            padding: "0.25rem",
          }}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ─── Mobile Sidebar Overlay ───────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.7)",
                zIndex: 45,
              }}
              className="mobile-overlay"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "260px",
                background: "var(--bg-panel)",
                borderRight: "1px solid var(--border-subtle)",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                padding: "1rem 0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "0.5rem",
                }}
              >
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--fg-quaternary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <nav style={{ flex: 1 }}>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.8125rem",
                            fontWeight: isActive ? 500 : 400,
                            color: isActive
                              ? "var(--fg-primary)"
                              : "var(--fg-tertiary)",
                            background: isActive
                              ? "var(--surface-2)"
                              : "transparent",
                            textDecoration: "none",
                          }}
                        >
                          <item.icon
                            size={16}
                            style={{
                              color: isActive
                                ? "var(--accent)"
                                : "var(--fg-quaternary)",
                            }}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                style={{
                  width: "100%",
                  fontSize: "0.8125rem",
                  padding: "0.5rem",
                  justifyContent: "center",
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main
        className="main-content"
        style={{ flex: 1, marginLeft: "240px", minHeight: "100vh" }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "2rem 1.5rem",
          }}
        >
          {children}
        </div>
      </main>

      {/* ─── Responsive Styles ────────────────────────────────── */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
          .mobile-header {
            display: flex !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding-top: 56px !important;
          }
        }
      `}</style>
    </div>
  );
}
