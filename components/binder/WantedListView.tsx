"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { WantedCard, WantedCardInput } from "@/lib/binder";
import { binderApi, binderErrorMessage } from "@/services/binder";

import { BinderEmpty, BinderError, BinderLoading, LoadMore } from "./BinderFeedback";
import BinderModal from "./BinderModal";
import useBinderPage from "./useBinderPage";
import WantedCardForm from "./WantedCardForm";
import WantedCardRow from "./WantedCardRow";

const byId = (card: WantedCard) => card.id;

export default function WantedListView() {
  const loader = useCallback((page: number) => binderApi.wanted(page), []);
  const resource = useBinderPage("wanted", loader, byId);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<WantedCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  async function save(input: WantedCardInput) {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? await binderApi.updateWanted(editing.id, input)
        : await binderApi.createWanted(input);
      resource.updateItems((items) => editing
        ? items.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...items.filter((item) => item.id !== saved.id)]);
      setAdding(false);
      setEditing(null);
    } catch (error) {
      setFormError(binderErrorMessage(error, "This Wanted List card could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(card: WantedCard) {
    if (busyId || !window.confirm(`Remove ${card.card_name} from your Wanted List?`)) return;
    setBusyId(card.id);
    setRowErrors((errors) => ({ ...errors, [card.id]: "" }));
    try {
      await binderApi.removeWanted(card.id);
      resource.updateItems((items) => items.map((item) => item.id === card.id ? { ...item, status: "removed" } : item));
    } catch (error) {
      setRowErrors((errors) => ({ ...errors, [card.id]: binderErrorMessage(error, "Card could not be removed.") }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="wanted-list-title">
      <div className="flex items-center justify-between gap-4">
        <div><h2 id="wanted-list-title" className="text-lg font-bold">Wanted List</h2><p className="mt-1 text-sm text-muted-foreground">Cards you are looking for, matched by card identity.</p></div>
        <Button type="button" size="sm" onClick={() => { setEditing(null); setFormError(null); setAdding(true); }}><Plus aria-hidden="true" />Add wanted card</Button>
      </div>
      <div className="mt-5">
        {resource.loading ? <BinderLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title="Nothing wanted yet" detail="Add cards you are seeking and UntapGo will find matching public Binder listings." /> : null}
        {resource.items.length ? <div className="grid gap-x-6 divide-y divide-border/70 md:grid-cols-2 md:divide-y-0">{resource.items.map((card) => <WantedCardRow key={card.id} card={card} busy={busyId === card.id} error={rowErrors[card.id]} onEdit={() => { setAdding(false); setEditing(card); setFormError(null); }} onRemove={() => void remove(card)} />)}</div> : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
      <BinderModal open={adding || Boolean(editing)} title={editing ? "Edit wanted card" : "Add wanted card"} description="Wanted notes are public matching context when your Wanted List is visible." onClose={() => { if (!saving) { setAdding(false); setEditing(null); } }}>
        <WantedCardForm initial={editing ?? undefined} saving={saving} error={formError} onSave={save} onCancel={() => { setAdding(false); setEditing(null); }} />
      </BinderModal>
    </section>
  );
}
