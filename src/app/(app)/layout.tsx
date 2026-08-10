"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  ChatTeardropText,
  PlugsConnected,
  SlidersHorizontal,
  SignOut,
  List,
  X,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { daysRemaining, getInitials } from "@/lib/utils/helpers";
import { Wordmark, Mark } from "@/components/brand";
import { BackgroundStage } from "@/components/background-stage";
import { CursorGlow } from "@/components/motion";
import type { Profile } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: ChartBar },
  { href: "/reviews", label: "Reviews", icon: ChatTeardropText },
  { href: "/connections", label: "Locations", icon: PlugsConnected },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
] as const;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setProfile(
          (data as Profile) ?? ({ email: user.email, full_name: null } as Profile)
        );
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Escape closes the drawer; body scroll is locked while it is open.
  useEffect(() => {
    if (!navOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/login");
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-canvas">
        <Mark size={32} className="opacity-45" />
        <span className="sr-only" role="status">
          Loading your workspace…
        </span>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.email || "Account";
  const trialDays =
    profile?.plan === "trial" ? daysRemaining(profile.trial_ends_at) : null;

  const navList = (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setNavOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-9 items-center gap-2.5 rounded-md pl-3 pr-2.5",
              "text-sm font-medium",
              "transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
              active
                ? "bg-surface-2 text-ink"
                : "text-ink-3 hover:translate-x-0.5 hover:bg-surface-1 hover:text-ink-2"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 h-4 w-[3px] rounded-r-full bg-accent",
                "transition-opacity duration-[var(--dur-fast)]",
                active ? "opacity-100" : "opacity-0"
              )}
            />
            <Icon
              size={17}
              weight={active ? "fill" : "regular"}
              aria-hidden="true"
              className={active ? "text-accent" : "text-ink-4 group-hover:text-ink-3"}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const accountBlock = (
    <div className="border-t border-line pt-3">
      {trialDays !== null && (
        <div className="ticks relative mb-3 rounded-md border border-accent/20 bg-accent/8 px-3 py-2.5">
          <p className="text-2xs font-medium text-accent">
            Trial ends in{" "}
            <span data-numeric className="font-mono">
              {trialDays}
            </span>{" "}
            {trialDays === 1 ? "day" : "days"}
          </p>
          {/* Bar mirrors the countdown, so the state is legible at a
              glance rather than only as a number. 14-day trial. */}
          <div
            aria-hidden="true"
            className="mt-2 h-0.5 overflow-hidden rounded-full bg-accent/15"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, (trialDays / 14) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-2xs text-ink-3">
            Replies keep posting after you pick a plan.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2.5 px-1">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-3 text-2xs font-semibold text-ink-2"
        >
          {getInitials(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink-2">
            {displayName}
          </p>
          {profile?.email && profile.full_name && (
            <p className="truncate text-2xs text-ink-4">{profile.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md text-ink-4",
            "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
            "hover:bg-surface-2 hover:text-critical active:scale-[0.97]"
          )}
        >
          <SignOut size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[100dvh]">
      <BackgroundStage variant="app" />
      <CursorGlow />
      {/* Desktop rail. Semi-transparent so the page bloom reads through
          it, which stops the sidebar looking like a pasted-on slab. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden lg:flex",
          "w-[var(--shell-sidebar)] flex-col justify-between",
          "border-r border-line bg-surface-1/70 px-3 py-4 backdrop-blur-xl"
        )}
      >
        <div className="flex flex-col gap-6">
          <Link
            href="/dashboard"
            className="px-1.5"
            aria-label="ReviewMint dashboard"
          >
            <Wordmark size={26} />
          </Link>
          {navList}
        </div>
        {accountBlock}
      </aside>

      {/* Mobile bar */}
      <header
        className={cn(
          "sticky top-0 z-30 flex h-[var(--shell-topbar)] items-center justify-between lg:hidden",
          "border-b border-line bg-canvas/70 px-4 backdrop-blur-xl",
          "pt-[env(safe-area-inset-top)]"
        )}
      >
        <Link href="/dashboard" aria-label="ReviewMint dashboard">
          <Wordmark size={24} />
        </Link>
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={navOpen}
          className="grid size-9 place-items-center rounded-md text-ink-2 transition-colors duration-[var(--dur-fast)] hover:bg-surface-2 active:scale-[0.97]"
        >
          <List size={19} aria-hidden="true" />
        </button>
      </header>

      {/* Mobile drawer. Kept mounted so the exit transition actually runs. */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          navOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!navOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className={cn(
            "absolute inset-0 bg-canvas/70 backdrop-blur-sm",
            "transition-opacity ease-[var(--ease-out-expo)]",
            navOpen
              ? "opacity-100 duration-[var(--dur-base)]"
              : "opacity-0 duration-[var(--dur-fast)]"
          )}
        />
        <div
          role="dialog"
          aria-modal={navOpen}
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(19rem,86vw)] flex-col justify-between",
            "overscroll-contain border-l border-line bg-surface-1 px-3 py-4",
            "shadow-[var(--shadow-lg)]",
            "transition-transform ease-[var(--ease-drawer)]",
            navOpen
              ? "translate-x-0 duration-[var(--dur-base)]"
              : "translate-x-full duration-[var(--dur-fast)]"
          )}
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-1.5">
              <Wordmark size={24} />
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors duration-[var(--dur-fast)] hover:bg-surface-2 hover:text-ink active:scale-[0.97]"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {navList}
          </div>
          {accountBlock}
        </div>
      </div>

      <main
        id="main"
        className="relative z-10 lg:pl-[var(--shell-sidebar)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
