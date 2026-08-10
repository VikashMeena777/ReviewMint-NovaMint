"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/primitives";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { GoogleGlyph } from "@/components/google-glyph";
import { timeAgo } from "@/lib/utils/helpers";
import type { GoogleConnection } from "@/types";

export default function ConnectionsPage() {
  const params = useSearchParams();
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<GoogleConnection | null>(
    null
  );

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data } = user
        ? await supabase
            .from("google_connections")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("connected_at", { ascending: false })
        : { data: null };

      if (cancelled) return;
      setConnections((data as GoogleConnection[]) ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Google Business Profile locations ReviewMint reads reviews from."
        action={
          <Button
            onClick={connect}
            loading={connecting}
            loadingLabel="Opening Google…"
          >
            {!connecting && <Plus size={14} aria-hidden="true" />}
            Connect location
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          title="How the connection works"
          description="ReviewMint asks Google for permission to read reviews and post replies for the locations you choose. Nothing else on your account is touched, and you can revoke access at any time from your Google account."
        />
      </Panel>

      <Panel>
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

      {/* Destructive actions are confirmed, never executed on first click. */}
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
    </div>
  );
}
