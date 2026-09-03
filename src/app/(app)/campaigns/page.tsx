"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PaperPlaneTilt,
  WhatsappLogo,
  EnvelopeSimple,
  Plus,
  ArrowClockwise,
  WarningCircle,
  Check,
  Clock,
  Eye,
  X,
  CaretDown,
  FileCsv,
  UserPlus,
  CurrencyInr,
  CopySimple,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/helpers";
import type {
  ReviewRequest,
  GoogleConnection,
  WhatsAppConnection,
  CampaignSettings,
  Channel,
  SendMode,
  Language,
} from "@/types";

// ─── Status Config ──────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Check }> = {
  pending: { label: "Pending", color: "text-ink-3 bg-surface-3", icon: Clock },
  scheduled: { label: "Scheduled", color: "text-amber-400 bg-amber-400/12", icon: Clock },
  sent: { label: "Sent", color: "text-blue-400 bg-blue-400/12", icon: PaperPlaneTilt },
  delivered: { label: "Delivered", color: "text-accent bg-accent/12", icon: Check },
  read: { label: "Read", color: "text-emerald-400 bg-emerald-400/12", icon: Eye },
  failed: { label: "Failed", color: "text-critical bg-critical/12", icon: X },
  skipped: { label: "Skipped", color: "text-ink-4 bg-surface-3", icon: X },
};

const CHANNEL_ICONS: Record<string, typeof WhatsappLogo> = {
  whatsapp: WhatsappLogo,
  email: EnvelopeSimple,
  both: PaperPlaneTilt,
};

export default function CampaignsPage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [waConnection, setWaConnection] = useState<WhatsAppConnection | null>(null);
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    channel: "whatsapp" as Channel,
    send_mode: "manual" as SendMode,
    language: "en" as Language,
    connection_id: "",
    visit_notes: "",
  });
  const [csvData, setCsvData] = useState("");

  // ─── Load Data ────────────────────────────

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [reqRes, connRes, waRes, settingsRes, profileRes] = await Promise.all([
      supabase.from("review_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("google_connections").select("*").eq("user_id", user.id).eq("is_active", true),
      supabase.from("whatsapp_connections").select("*").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
      supabase.from("campaign_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("wallet_balance").eq("id", user.id).single(),
    ]);

    setRequests((reqRes.data as ReviewRequest[]) || []);
    setConnections((connRes.data as GoogleConnection[]) || []);
    setWaConnection((waRes.data as WhatsAppConnection) || null);
    setSettings((settingsRes.data as CampaignSettings) || null);
    setBalance((profileRes.data as { wallet_balance: number })?.wallet_balance || 0);

    // Set default connection
    if (connRes.data?.length) {
      const firstConn = connRes.data[0] as GoogleConnection;
      setForm(f => ({ ...f, connection_id: firstConn.id }));
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Get Review Link ──────────────────────

  const getReviewLink = () => {
    if (settings?.google_review_url) return settings.google_review_url;
    const conn = connections.find(c => c.id === form.connection_id) || connections[0];
    if (conn?.review_url) return conn.review_url;
    if (conn?.place_id) return `https://search.google.com/local/reviews/writereview?placeid=${conn.place_id}`;
    return "";
  };

  // ─── Send Single Request ──────────────────

  async function handleSend() {
    const reviewLink = getReviewLink();
    if (!reviewLink) {
      toast.error("No review link found. Connect a Google location or paste a review URL in settings.");
      return;
    }
    if (!form.customer_name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if ((form.channel === "whatsapp" || form.channel === "both") && !form.customer_phone.trim()) {
      toast.error("Phone number is required for WhatsApp.");
      return;
    }
    if ((form.channel === "email" || form.channel === "both") && !form.customer_email.trim()) {
      toast.error("Email is required for email channel.");
      return;
    }
    if (form.send_mode === "auto" && !waConnection) {
      toast.error("Connect WhatsApp first to use auto mode.");
      return;
    }
    if (form.send_mode === "auto" && balance < 1) {
      toast.error("Insufficient credits. Buy credits to use auto mode.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, review_link: reviewLink }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send");
        return;
      }

      // Manual mode: open wa.me link
      if (data.wa_link) {
        window.open(data.wa_link, "_blank");
        toast.success("WhatsApp opened! Send the message to your customer.");
      } else {
        toast.success("Review request sent successfully!");
      }

      if (data.new_balance !== undefined) setBalance(data.new_balance);

      // Reset form
      setForm(f => ({ ...f, customer_name: "", customer_phone: "", customer_email: "", visit_notes: "" }));
      setShowForm(false);
      loadData();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  // ─── Bulk Import ──────────────────────────

  async function handleBulkImport() {
    if (!csvData.trim()) {
      toast.error("Paste CSV data first.");
      return;
    }
    const reviewLink = getReviewLink();
    if (!reviewLink) {
      toast.error("No review link found.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/campaigns/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_data: csvData,
          review_link: reviewLink,
          channel: form.channel,
          send_mode: form.send_mode,
          language: form.language,
          connection_id: form.connection_id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }

      toast.success(`Imported ${data.imported} requests. ${data.skipped ? `(${data.skipped} skipped)` : ""}`);
      setCsvData("");
      setShowBulk(false);
      loadData();
    } catch {
      toast.error("Import failed.");
    } finally {
      setSending(false);
    }
  }

  // ─── Resend Failed ────────────────────────

  async function handleResend(requestId: string) {
    // Find the original request and re-send
    const original = requests.find(r => r.id === requestId);
    if (!original) return;

    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: original.customer_name,
          customer_phone: original.customer_phone,
          customer_email: original.customer_email,
          channel: original.channel,
          send_mode: original.send_mode,
          language: original.language,
          review_link: original.review_link,
          connection_id: original.connection_id,
        }),
      });
      const data = await res.json();

      if (data.wa_link) {
        window.open(data.wa_link, "_blank");
      }

      toast.success("Resent successfully!");
      loadData();
    } catch {
      toast.error("Resend failed.");
    }
  }

  // ─── Stats ────────────────────────────────

  const stats = {
    total: requests.length,
    sent: requests.filter(r => ["sent", "delivered", "read"].includes(r.status)).length,
    delivered: requests.filter(r => ["delivered", "read"].includes(r.status)).length,
    failed: requests.filter(r => r.status === "failed").length,
    pending: requests.filter(r => ["pending", "scheduled"].includes(r.status)).length,
  };

  // ─── Render ───────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaigns" description="Send review requests to your customers" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const reviewLink = getReviewLink();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Send review requests to your customers"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowBulk(!showBulk)}>
              <FileCsv size={15} weight="bold" />
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <UserPlus size={15} weight="bold" />
              Add Customer
            </Button>
          </div>
        }
      />

      {/* Low balance warning */}
      {balance <= 0 && (
        <div className="rounded-lg border border-critical/25 bg-critical/8 px-4 py-3 flex items-center gap-3">
          <WarningCircle size={18} className="text-critical shrink-0" weight="fill" />
          <p className="text-sm text-critical font-medium flex-1">
            Auto mode is disabled. You have 0 credits.{" "}
            <a href="/wallet" className="underline underline-offset-2 hover:no-underline">Buy credits</a>
          </p>
        </div>
      )}
      {balance > 0 && balance < 10 && (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/8 px-4 py-3 flex items-center gap-3">
          <WarningCircle size={18} className="text-amber-400 shrink-0" weight="fill" />
          <p className="text-sm text-amber-400 font-medium flex-1">
            Low credits: {balance} remaining.{" "}
            <a href="/wallet" className="underline underline-offset-2 hover:no-underline">Buy more</a>
          </p>
        </div>
      )}

      {/* WhatsApp template status */}
      {waConnection && waConnection.template_status !== "approved" && (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/8 px-4 py-3 flex items-center gap-3">
          <Clock size={18} className="text-amber-400 shrink-0" weight="fill" />
          <p className="text-sm text-amber-400 font-medium flex-1">
            WhatsApp templates are {waConnection.template_status === "pending" ? "pending Meta approval (24-48h)" : "rejected — resubmit in settings"}.
            Auto WhatsApp is disabled until templates are approved.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Sent", value: stats.sent, color: "text-accent" },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-400" },
          { label: "Pending", value: stats.pending, color: "text-amber-400" },
          { label: "Failed", value: stats.failed, color: "text-critical" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-line bg-surface-1/60 px-4 py-3">
            <p className="text-2xs text-ink-4 uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-2xl font-semibold font-mono mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <Panel>
          <PanelHeader
            title="Send Review Request"
            description={reviewLink ? `Link: ${reviewLink.substring(0, 60)}...` : "⚠️ No review link — connect a Google location first"}
          />
          <div className="p-4 space-y-4">
            {/* Customer Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Customer Name *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Dr. Priya Sharma"
                  className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                  placeholder="9876543210"
                  className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                  placeholder="priya@example.com"
                  className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Visit Notes</label>
                <input
                  type="text"
                  value={form.visit_notes}
                  onChange={e => setForm(f => ({ ...f, visit_notes: e.target.value }))}
                  placeholder="Root canal treatment"
                  className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                />
              </div>
            </div>

            {/* Options */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Channel */}
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Channel</label>
                <div className="relative">
                  <select
                    value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value as Channel }))}
                    className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="both">Both</option>
                  </select>
                  <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Mode</label>
                <div className="relative">
                  <select
                    value={form.send_mode}
                    onChange={e => setForm(f => ({ ...f, send_mode: e.target.value as SendMode }))}
                    className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="manual">Manual (wa.me link)</option>
                    <option value="auto">Auto (Cloud API) — 1 credit</option>
                  </select>
                  <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Language</label>
                <div className="relative">
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value as Language }))}
                    className="w-full h-9.5 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                  <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Auto mode info */}
            {form.send_mode === "auto" && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 flex items-center gap-2 text-xs text-accent">
                <CurrencyInr size={14} weight="bold" />
                <span>1 credit per message · Balance: <strong>{balance}</strong> credits</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSend} loading={sending} loadingLabel="Sending...">
                <PaperPlaneTilt size={15} weight="bold" />
                {form.send_mode === "manual" ? "Open WhatsApp" : "Send Now"}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Bulk CSV Import */}
      {showBulk && (
        <Panel>
          <PanelHeader
            title="Bulk Import from CSV"
            description="Paste CSV with columns: name, phone, email (headers required)"
          />
          <div className="p-4 space-y-3">
            <textarea
              value={csvData}
              onChange={e => setCsvData(e.target.value)}
              placeholder={`name,phone,email\nPriya Sharma,9876543210,priya@email.com\nRahul Patel,8765432109,rahul@email.com`}
              rows={6}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink font-mono placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)}>Cancel</Button>
              <Button size="sm" onClick={handleBulkImport} loading={sending} loadingLabel="Importing...">
                <FileCsv size={15} weight="bold" />
                Import ({csvData.trim().split("\n").length - 1} rows)
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Review Link Display */}
      {reviewLink && (
        <div className="rounded-lg border border-line bg-surface-1/60 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">⭐</span>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-ink-4 uppercase tracking-wider">Your Google Review Link</p>
            <p className="text-xs text-ink-2 font-mono truncate mt-0.5">{reviewLink}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(reviewLink); toast.success("Link copied!"); }}
            className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <CopySimple size={15} />
          </button>
        </div>
      )}

      {/* Requests Table */}
      <Panel>
        <PanelHeader title="Review Requests" description={`${stats.total} total requests`} />
        <div className="divide-y divide-line">
          {requests.length === 0 ? (
            <EmptyState
              icon={<PaperPlaneTilt size={20} />}
              title="No review requests yet"
              description="Send your first review request to start collecting Google reviews."
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus size={14} weight="bold" />
                  Send First Request
                </Button>
              }
            />
          ) : (
            requests.map((req) => {
              const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const ChannelIcon = CHANNEL_ICONS[req.channel] || PaperPlaneTilt;

              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-1/50 transition-colors"
                >
                  {/* Channel Icon */}
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2">
                    <ChannelIcon
                      size={17}
                      weight="fill"
                      className={req.channel === "whatsapp" ? "text-green-400" : "text-blue-400"}
                    />
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink truncate">{req.customer_name}</p>
                      {req.send_mode === "auto" && (
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">AUTO</span>
                      )}
                      {req.language === "hi" && (
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-surface-3 text-ink-3 font-medium">हिंदी</span>
                      )}
                    </div>
                    <p className="text-2xs text-ink-4 mt-0.5">
                      {req.customer_phone || req.customer_email} · {timeAgo(req.created_at)}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <Badge className={cn("text-2xs px-2 py-0.5 rounded-md flex items-center gap-1", statusConfig.color)}>
                    <StatusIcon size={12} weight="bold" />
                    {statusConfig.label}
                  </Badge>

                  {/* Resend button for failed */}
                  {req.status === "failed" && (
                    <button
                      onClick={() => handleResend(req.id)}
                      className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
                      title="Resend"
                    >
                      <ArrowClockwise size={15} />
                    </button>
                  )}

                  {/* Credits used */}
                  {req.credits_used > 0 && (
                    <span className="text-2xs text-ink-4 font-mono">-{req.credits_used}cr</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}
