"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Envelope,
  Eye,
  EyeSlash,
  Lock,
  User,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/controls";
import { GoogleGlyph } from "@/components/google-glyph";

const MIN_PASSWORD = 8;

type Errors = Partial<Record<"fullName" | "email" | "password", string>>;

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // Validate every field in one pass so the user sees all problems at once.
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Tell us what to call you.";
    if (!email.trim()) next.email = "An email address is required.";
    if (password.length < MIN_PASSWORD) {
      next.password = `Use at least ${MIN_PASSWORD} characters.`;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setErrors({ email: error.message });
      return;
    }

    toast.success("Account created. Check your inbox to confirm the address.");
    router.push("/dashboard");
    router.refresh();
  }

  async function withGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error("Google sign-up could not start. Try again.");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Connect a location and your first replies go out today."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Sign in
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
          <Field label="Full name" htmlFor="name" error={errors.fullName}>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Rukmini Nadar"
              icon={<User size={15} />}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              aria-invalid={Boolean(errors.fullName) || undefined}
              aria-describedby={errors.fullName ? "name-error" : undefined}
            />
          </Field>

          <Field label="Work email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              icon={<Envelope size={15} />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email) || undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password}
            hint={`At least ${MIN_PASSWORD} characters.`}
          >
            <Input
              id="password"
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              icon={<Lock size={15} />}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password) || undefined}
              aria-describedby={
                errors.password ? "password-error" : "password-hint"
              }
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
            loadingLabel="Creating account…"
          >
            Create account
            {!loading && <ArrowRight size={15} aria-hidden="true" />}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
