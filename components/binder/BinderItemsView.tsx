"use client";

import { useCallback, useEffect, useState } from "react";

import type { BinderFilters as BinderFilterValues, BinderItem, BinderItemFormErrors, BinderItemInput } from "@/lib/binder";
import { binderApi, binderErrorMessage, binderItemSaveErrors } from "@/services/binder";

import BinderCard from "./BinderCard";
import { BinderEmpty, BinderError, BinderLoading, LoadMore } from "./BinderFeedback";
import BinderFilters, { EMPTY_BINDER_FILTERS } from "./BinderFilters";
import BinderItemForm from "./BinderItemForm";
import BinderModal from "./BinderModal";
import useBinderPage from "./useBinderPage";

const byId = (item: BinderItem) => item.id;

export default function BinderItemsView({ addRequest }: { addRequest: number }) {
  const [filters, setFilters] = useState<BinderFilterValues>(EMPTY_BINDER_FILTERS);
  const [editing, setEditing] = useState<BinderItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<BinderItemFormErrors | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const scope = JSON.stringify(filters);
  const loader = useCallback((page: number) => binderApi.items(filters, page), [scope]); // eslint-disable-line react-hooks/exhaustive-deps
  const resource = useBinderPage(scope, loader, byId);

  useEffect(() => {
    if (addRequest > 0) {
      setEditing(null);
      setFormError(null);
      setAdding(true);
    }
  }, [addRequest]);

  async function save(input: BinderItemInput) {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? await binderApi.updateItem(editing.id, input)
        : await binderApi.createItem(input);
      resource.updateItems((items) => editing
        ? items.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...items.filter((item) => item.id !== saved.id)]);
      setAdding(false);
      setEditing(null);
    } catch (error) {
      setFormError(binderItemSaveErrors(error));
    } finally {
      setSaving(false);
    }
  }

  async function mutateStatus(item: BinderItem, status: BinderItem["status"]) {
    if (busyIds.has(item.id)) return;
    if (status === "completed" && !window.confirm(`Mark ${item.card_name} completed?`)) return;
    setBusyIds((ids) => new Set(ids).add(item.id));
    setRowErrors((errors) => ({ ...errors, [item.id]: "" }));
    try {
      const updated = await binderApi.patchItem(item.id, { status });
      resource.updateItems((items) => items.map((value) => value.id === item.id ? updated : value));
    } catch (error) {
      setRowErrors((errors) => ({ ...errors, [item.id]: binderErrorMessage(error, "Card status could not be changed.") }));
    } finally {
      setBusyIds((ids) => { const next = new Set(ids); next.delete(item.id); return next; });
    }
  }

  async function withdraw(item: BinderItem) {
    if (busyIds.has(item.id) || !window.confirm(`Withdraw ${item.card_name} from your Binder?`)) return;
    setBusyIds((ids) => new Set(ids).add(item.id));
    try {
      await binderApi.withdrawItem(item.id);
      resource.updateItems((items) => items.map((value) => value.id === item.id ? { ...value, status: "withdrawn" } : value));
    } catch (error) {
      setRowErrors((errors) => ({ ...errors, [item.id]: binderErrorMessage(error, "Card could not be withdrawn.") }));
    } finally {
      setBusyIds((ids) => { const next = new Set(ids); next.delete(item.id); return next; });
    }
  }

  async function remove(item: BinderItem) {
    if (busyIds.has(item.id) || !window.confirm(`Remove ${item.card_name} from your Binder? This cannot be undone.`)) return;
    setBusyIds((ids) => new Set(ids).add(item.id));
    setRowErrors((errors) => ({ ...errors, [item.id]: "" }));
    try {
      await binderApi.removeItem(item.id);
      resource.updateItems((items) => items.filter((value) => value.id !== item.id));
    } catch (error) {
      setRowErrors((errors) => ({ ...errors, [item.id]: binderErrorMessage(error, "Card could not be removed from your Binder.") }));
    } finally {
      setBusyIds((ids) => { const next = new Set(ids); next.delete(item.id); return next; });
    }
  }

  async function shareItem(item: BinderItem) {
    const href = `${window.location.origin}/binder/item/${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.printed_name || item.card_name, url: href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(href);
  }

  return (
    <section aria-labelledby="my-binder-title">
      <h2 id="my-binder-title" className="sr-only">My Binder</h2>
      <BinderFilters value={filters} onChange={setFilters} owner />
      <div className="mt-6">
        {resource.loading ? <BinderLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title="Your Binder is ready" detail="Add an exact Magic card printing to make it available for trade or sale." /> : null}
        {resource.items.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{resource.items.map((item) => <BinderCard key={item.id} item={item} owner busy={busyIds.has(item.id)} error={rowErrors[item.id]} onEdit={() => { setAdding(false); setEditing(item); setFormError(null); }} onStatus={(status) => void mutateStatus(item, status)} onWithdraw={() => void withdraw(item)} onRemove={() => void remove(item)} onShare={() => void shareItem(item)} />)}</div> : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
      <BinderModal open={adding || Boolean(editing)} title={editing ? "Edit Binder card" : "Add card"} description={editing ? "Update the printed language or listing details." : "Choose the exact printing and printed language."} onClose={() => { if (!saving) { setAdding(false); setEditing(null); } }}>
        <BinderItemForm initial={editing ?? undefined} saving={saving} error={formError} onSave={save} onClearError={() => setFormError(null)} onCancel={() => { setAdding(false); setEditing(null); }} />
      </BinderModal>
    </section>
  );
}
