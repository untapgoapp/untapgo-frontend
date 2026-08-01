"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BinderSettings } from "@/lib/binder";
import { binderApi, binderErrorMessage } from "@/services/binder";

export default function BinderSettingsPanel() {
  const [settings, setSettings] = useState<BinderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void binderApi.settings().then((value) => { if (active) setSettings(value); }).catch(() => { if (active) setError("Binder privacy settings could not be loaded."); });
    return () => { active = false; };
  }, []);

  async function save() {
    if (!settings || saving) return;
    setSaving(true);
    setError(null);
    try {
      setSettings(await binderApi.updateSettings(settings));
    } catch (caught) {
      setError(binderErrorMessage(caught, "Binder privacy settings could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="rounded-row bg-surface-subtle px-3 py-2 text-sm">
      <summary className="cursor-pointer font-semibold">Privacy</summary>
      {settings ? <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center"><label className="font-medium">Binder visibility<select value={settings.visibility} onChange={(event) => setSettings({ ...settings, visibility: event.target.value as BinderSettings["visibility"] })} className="mt-1 block h-10 w-full rounded-control border border-input bg-surface px-3"><option value="public">Public to players</option><option value="private">Private</option></select></label><label className="flex items-center gap-2 pt-4"><input type="checkbox" checked={settings.show_wanted_list} onChange={(event) => setSettings({ ...settings, show_wanted_list: event.target.checked })} className="h-4 w-4 accent-primary" />Show Wanted List on my public Binder</label><Button type="button" size="sm" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Button></div> : <p className="mt-2 text-muted-foreground">Loading privacy settings…</p>}
      {error ? <p role="alert" className="mt-2 text-destructive">{error}</p> : null}
    </details>
  );
}
