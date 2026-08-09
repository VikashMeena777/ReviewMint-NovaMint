"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MessageSquareText, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div
      className="bg-gradient-radial"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2.5rem",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "2rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquareText size={20} color="#fff" />
          </div>
          <span className="heading-section" style={{ fontSize: "1.375rem", color: "var(--text-primary)" }}>
            Review<span style={{ color: "var(--primary)" }}>Mint</span>
          </span>
        </Link>

        <h1
          className="heading-section"
          style={{
            fontSize: "1.5rem",
            textAlign: "center",
            marginBottom: "0.375rem",
          }}
        >
          Welcome Back
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            marginBottom: "1.75rem",
          }}
        >
          Sign in to manage your reviews
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-ghost"
          style={{
            width: "100%",
            marginBottom: "1.5rem",
            padding: "0.7rem",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "0.375rem",
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "0.375rem",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            marginTop: "1.5rem",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Start free trial
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
