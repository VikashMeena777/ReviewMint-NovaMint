"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FloppyDisk, PlugsConnected } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { Field, Input, Textarea, Toggle, ChoiceGrid, Chips } from "@/components/ui/controls";
import { EmptyState, Skeleton } from "@/components/ui/states";
import type { ReplySettings } from "@/types";

const TONES = [
  {
    value: "professional",
    label: "Professional",
    description: "Measured and polished. Safe default for services and B2B.",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and human. Works well for most local businesses.",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Conversational and light. Suits cafés and retail.",
  },
  {
    value: "enthusiastic",
    label: "Enthusiastic",
    description: "High energy. Fits events, fitness and entertainment.",
  },
] as const;

const DELAYS = [
  { value: 0, label: "Instant" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ReplySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: connections }, { data: existing }] = await Promise.all([
        supabase
          .from("google_connections")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1),
        supabase
          .from("reply_settings")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      setHasConnection((connections ?? []).length > 0);
      setSettings(
        (existing as ReplySettings) ?? {
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
        }
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Local field updater. Keeps the form controlled without a form library. */
  function patch(changes: Partial<ReplySettings>) {
    setSettings((current) => (current ? { ...current, ...changes } : current));
  }

  async function save() {
    if (!settings) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      toast.error("Your session expired. Sign in again to save.");
      return;
    }

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

    const { data, error } = settings.id
      ? await supabase
          .from("reply_settings")
          .update(payload)
          .eq("id", settings.id)
          .select()
          .single()
      : await supabase.from("reply_settings").insert(payload).select().single();

    setSaving(false);

    if (error) {
      toast.error("Settings could not be saved. Try again.");
      return;
    }

    // Capture the generated id so a second save updates instead of inserting.
    if (data) setSettings(data as ReplySettings);
    toast.success("Settings saved.");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-44" />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!hasConnection) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="How ReviewMint writes and posts replies on your behalf."
        />
        <Panel>
          <EmptyState
            icon={<PlugsConnected size={19} aria-hidden="true" />}
            title="Connect a location first"
            description="Reply settings apply to a connected Google Business Profile. Once a location is linked, this page unlocks."
            action={
              <ButtonLink href="/connections">Connect a location</ButtonLink>
            }
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="How ReviewMint writes and posts replies on your behalf."
        action={
          <Button onClick={save} loading={saving} loadingLabel="Saving…">
            {!saving && <FloppyDisk size={14} aria-hidden="true" />}
            Save changes
          </Button>
        }
      />

      <Panel>
        <div className="p-5">
          <Toggle
            checked={settings?.auto_reply_enabled ?? false}
            onChange={(next) => patch({ auto_reply_enabled: next })}
            label="Automatic replies"
            description="Write and post a reply to every new review without waiting for approval."
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Tone"
          description="Sets the voice of every generated reply."
        />
        <div className="p-5 pt-4">
          <ChoiceGrid
            label="Reply tone"
            value={settings?.tone ?? "professional"}
            onChange={(next) =>
              patch({ tone: next as ReplySettings["tone"] })
            }
            options={TONES.map((tone) => ({ ...tone }))}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Delay"
          description="Time to wait after a review lands before the reply posts. A short delay reads more naturally than an instant response."
        />
        <div className="p-5 pt-4">
          <Chips
            label="Reply delay"
            value={settings?.reply_delay_minutes ?? 15}
            onChange={(next) => patch({ reply_delay_minutes: next })}
            options={DELAYS}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Business context"
          description="The more specific this is, the less generic the replies read."
        />
        <div className="space-y-5 p-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Business name" htmlFor="business-name">
              <Input
                id="business-name"
                placeholder="Somara Coworking"
                value={settings?.business_name ?? ""}
                onChange={(event) =>
                  patch({ business_name: event.target.value })
                }
              />
            </Field>
            <Field label="Category" htmlFor="business-type">
              <Input
                id="business-type"
                placeholder="Coworking space"
                value={settings?.business_type ?? ""}
                onChange={(event) =>
                  patch({ business_type: event.target.value })
                }
              />
            </Field>
            <Field label="Location" htmlFor="business-location">
              <Input
                id="business-location"
                placeholder="Bengaluru, India"
                value={settings?.business_location ?? ""}
                onChange={(event) =>
                  patch({ business_location: event.target.value })
                }
              />
            </Field>
          </div>

          <Field
            label="What the business does"
            htmlFor="business-context"
            hint="Mention what you offer and who you serve. This is the biggest lever on reply quality."
          >
            <Textarea
              id="business-context"
              rows={3}
              placeholder="A 100-seat coworking space with private meeting rooms and a coffee bar, mostly used by startups and freelancers."
              value={settings?.business_context ?? ""}
              onChange={(event) =>
                patch({ business_context: event.target.value })
              }
            />
          </Field>

          <Field
            label="Rules"
            htmlFor="custom-instructions"
            hint="Optional. Anything the reply should always or never say."
          >
            <Textarea
              id="custom-instructions"
              rows={2}
              placeholder="Always offer a free day pass to first-time visitors. Never name competitors."
              value={settings?.custom_instructions ?? ""}
              onChange={(event) =>
                patch({ custom_instructions: event.target.value })
              }
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
