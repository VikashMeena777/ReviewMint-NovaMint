"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Envelope, Eye, EyeSlash, Lock } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/controls";
import { GoogleGlyph } from "@/components/google-glyph";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      // Keep the message generic: confirming which half was wrong tells an
      // attacker whether the address exists.
      setError("That email and password combination did not work.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function withGoogle() {
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) toast.error("Google sign-in could not start. Try again.");
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Pick up where your replies left off."
      footer={
        <>
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={withGoogle}
          className="gap-2.5"
        >
          <GoogleGlyph size={18} className="border-0 bg-transparent" />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-line-2" />
          <span className="text-2xs text-ink-4">or</span>
          <span className="h-px flex-1 bg-line-2" />
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              icon={<Envelope size={15} />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error) || undefined}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={error ?? undefined}>
            <Input
              id="password"
              type={reveal ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              icon={<Lock size={15} />}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "password-error" : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setReveal((current) => !current)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="grid size-7 place-items-center rounded text-ink-4 transition-colors duration-[var(--dur-fast)] hover:text-ink-2"
                >
                  {reveal ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            loadingLabel="Signing in…"
          >
            Sign in
            {!loading && <ArrowRight size={15} aria-hidden="true" />}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
