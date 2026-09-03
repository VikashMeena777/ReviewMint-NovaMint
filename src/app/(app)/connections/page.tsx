"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Plus, Trash, WarningCircle, WhatsappLogo, CheckCircle, Clock, XCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/primitives";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { GoogleGlyph } from "@/components/google-glyph";
import FacebookSDK from "@/components/facebook-sdk";
import { timeAgo } from "@/lib/utils/helpers";
import type { GoogleConnection, WhatsAppConnection } from "@/types";

export default function ConnectionsPage() {
  const params = useSearchParams();
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [waConnection, setWaConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<GoogleConnection | null>(null);
  const [pendingWaRemoval, setPendingWaRemoval] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [googleRes, waRes] = await Promise.all([
      supabase
        .from("google_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("connected_at", { ascending: false }),
      supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single(),
    ]);

    setConnections((googleRes.data as GoogleConnection[]) ?? []);
    setWaConnection((waRes.data as WhatsAppConnection | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Surface the OAuth round-trip result once, on return from Google.
  useEffect(() => {
    if (params.get("success") === "connected") {
      toast.success("Location connected. The first sync starts shortly.");
    } else if (params.get("error")) {
      toast.error("Google did not complete the connection. Try again.");
    }
  }, [params]);

  async function connect() {
    setConnecting(true);
    try {
      const response = await fetch("/api/google/auth-url");
      const result = await response.json();

      if (!response.ok || !result?.url) {
        throw new Error("Could not start the Google connection.");
      }
      window.location.href = result.url;
    } catch {
      toast.error("Could not reach Google. Check your connection and retry.");
      setConnecting(false);
    }
  }

  async function disconnect(connection: GoogleConnection) {
    const supabase = createClient();
    const { error } = await supabase
      .from("google_connections")
      .update({ is_active: false })
      .eq("id", connection.id);

    setPendingRemoval(null);

    if (error) {
      toast.error("The location could not be disconnected.");
      return;
    }

    setConnections((current) =>
      current.filter((item) => item.id !== connection.id)
    );
    toast.success("Location disconnected. Replies have stopped.");
  }

  // ─── WhatsApp Embedded Signup ─────────────
  async function connectWhatsApp() {
    setWaConnecting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FB = (window as any).FB;
      if (!FB) {
        toast.error("Facebook SDK not loaded. Refresh the page.");
        setWaConnecting(false);
        return;
      }

      FB.login(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response: any) => {
          if (response.authResponse) {
            const code = response.authResponse.code;
            // Send code to backend for token exchange
            fetch("/api/whatsapp/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  toast.success("WhatsApp connected! Templates submitted for approval.");
                  fetchData(); // Refresh
                } else {
                  toast.error(data.error || "Failed to connect WhatsApp.");
                }
              })
              .catch(() => toast.error("Failed to connect WhatsApp."))
              .finally(() => setWaConnecting(false));
          } else {
            toast.error("WhatsApp signup was cancelled.");
            setWaConnecting(false);
          }
        },
        {
          config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || "",
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "",
            sessionInfoVersion: "3",
          },
        }
      );
    } catch {
      toast.error("Could not start WhatsApp signup. Try again.");
      setWaConnecting(false);
    }
  }

  async function disconnectWhatsApp() {
    setPendingWaRemoval(false);
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWaConnection(null);
        toast.success("WhatsApp disconnected.");
      } else {
        toast.error(data.error || "Failed to disconnect.");
      }
    } catch {
      toast.error("Failed to disconnect WhatsApp.");
    }
  }

  const templateStatusMap = {
    pending: { label: "Templates Pending", icon: <Clock size={14} />, tone: "caution" as const },
    approved: { label: "Templates Approved", icon: <CheckCircle size={14} />, tone: "positive" as const },
    rejected: { label: "Templates Rejected", icon: <XCircle size={14} />, tone: "critical" as const },
  };

  return (
    <div className="space-y-6">
      <FacebookSDK />

      <PageHeader
        title="Connections"
        description="Connect your Google Business Profile and WhatsApp to automate review collection."
      />

      {/* ─── Google Section ──────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Google Business Profile"
          description="Locations ReviewMint reads reviews from and posts replies to."
          action={
            <Button
              onClick={connect}
              loading={connecting}
              loadingLabel="Opening Google…"
              size="sm"
            >
              {!connecting && <Plus size={14} aria-hidden="true" />}
              Connect location
            </Button>
          }
        />

        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-3.5 px-5 py-4">
                <Skeleton className="size-9 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            icon={<MapPin size={19} aria-hidden="true" />}
            title="No locations connected"
            description="Connect your Google Business Profile and ReviewMint starts pulling reviews for every location you select."
            action={
              <Button
                onClick={connect}
                loading={connecting}
                loadingLabel="Opening Google…"
              >
                Connect location
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {connections.map((connection) => (
              <li
                key={connection.id}
                className="flex items-start gap-3.5 px-5 py-4"
              >
                <GoogleGlyph size={36} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-ink">
                      {connection.location_name ?? "Unnamed location"}
                    </h3>
                    <Badge tone="positive">
                      <span aria-hidden="true" className="live-dot" />
                      Syncing
                    </Badge>
                  </div>

                  {connection.location_address && (
                    <p className="mt-1 truncate text-xs text-ink-3">
                      {connection.location_address}
                    </p>
                  )}

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-ink-4">
                    {connection.google_email && (
                      <span className="truncate">{connection.google_email}</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span data-numeric className="font-mono">
                      {connection.last_synced_at
                        ? `Synced ${timeAgo(connection.last_synced_at)}`
                        : "Awaiting first sync"}
                    </span>
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Disconnect ${connection.location_name ?? "this location"}`}
                  onClick={() => setPendingRemoval(connection)}
                  className="shrink-0 text-ink-4 hover:text-critical"
                >
                  <Trash size={15} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ─── WhatsApp Section ────────────────────────── */}
      <Panel>
        <PanelHeader
          title="WhatsApp Business"
          description="Connect your WhatsApp number to send automated review requests."
          action={
            !waConnection ? (
              <Button
                onClick={connectWhatsApp}
                loading={waConnecting}
                loadingLabel="Setting up…"
                size="sm"
              >
                {!waConnecting && <WhatsappLogo size={14} weight="fill" aria-hidden="true" />}
                Connect WhatsApp
              </Button>
            ) : undefined
          }
        />

        {loading ? (
          <div className="px-5 py-4">
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : !waConnection ? (
          <EmptyState
            icon={<WhatsappLogo size={20} weight="fill" aria-hidden="true" />}
            title="WhatsApp not connected"
            description="Connect your WhatsApp Business account to send automated review requests via WhatsApp. The setup takes 2 minutes."
            action={
              <Button
                onClick={connectWhatsApp}
                loading={waConnecting}
                loadingLabel="Setting up…"
              >
                <WhatsappLogo size={14} weight="fill" aria-hidden="true" />
                Connect WhatsApp
              </Button>
            }
          />
        ) : (
          <div className="px-5 py-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#25d366]/12 text-[#25d366]">
                <WhatsappLogo size={20} weight="fill" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-ink">
                    {waConnection.display_phone || "WhatsApp Business"}
                  </h3>
                  <Badge tone="positive">
                    <span aria-hidden="true" className="live-dot" />
                    Connected
                  </Badge>
                  {waConnection.template_status && (
                    <Badge tone={templateStatusMap[waConnection.template_status as keyof typeof templateStatusMap]?.tone || "neutral"}>
                      {templateStatusMap[waConnection.template_status as keyof typeof templateStatusMap]?.icon}
                      {templateStatusMap[waConnection.template_status as keyof typeof templateStatusMap]?.label || waConnection.template_status}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-2xs text-ink-4">
                  WABA ID: <span className="font-mono">{waConnection.waba_id}</span>
                  <span aria-hidden="true"> · </span>
                  Connected {timeAgo(waConnection.created_at)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Disconnect WhatsApp"
                onClick={() => setPendingWaRemoval(true)}
                className="shrink-0 text-ink-4 hover:text-critical"
              >
                <Trash size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </Panel>

      {/* ─── Google Disconnect Confirm ───────────────── */}
      {pendingRemoval && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disconnect-title"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cancel"
            onClick={() => setPendingRemoval(null)}
            className="absolute inset-0 bg-canvas/75 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-sm overscroll-contain rounded-lg border border-line-2 bg-surface-2 p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-md bg-critical/12 text-critical"
              >
                <WarningCircle size={18} />
              </span>
              <div className="min-w-0">
                <h2
                  id="disconnect-title"
                  className="text-sm font-semibold text-ink text-balance"
                >
                  Disconnect {pendingRemoval.location_name ?? "this location"}?
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-3 text-pretty">
                  ReviewMint stops reading reviews and stops posting replies for
                  this location. Replies already posted stay on Google. You can
                  reconnect it later.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingRemoval(null)}
              >
                Keep it
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => disconnect(pendingRemoval)}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WhatsApp Disconnect Confirm ─────────────── */}
      {pendingWaRemoval && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-disconnect-title"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cancel"
            onClick={() => setPendingWaRemoval(false)}
            className="absolute inset-0 bg-canvas/75 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-sm overscroll-contain rounded-lg border border-line-2 bg-surface-2 p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-md bg-critical/12 text-critical"
              >
                <WarningCircle size={18} />
              </span>
              <div className="min-w-0">
                <h2
                  id="wa-disconnect-title"
                  className="text-sm font-semibold text-ink text-balance"
                >
                  Disconnect WhatsApp?
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-3 text-pretty">
                  Auto-sending review requests via WhatsApp will stop. Manual sending with wa.me links will still work. You can reconnect later.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingWaRemoval(false)}
              >
                Keep it
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={disconnectWhatsApp}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

