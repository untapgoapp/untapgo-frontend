"use client";

import { useCallback, useState } from "react";

import type { BinderItem, BinderMatch, InterestType } from "@/lib/binder";
import { itemIdentity } from "@/lib/binder";
import { binderApi, binderErrorMessage } from "@/services/binder";

import { BinderEmpty, BinderError, BinderLoading, LoadMore } from "./BinderFeedback";
import InterestDialog from "./InterestDialog";
import MatchCard from "./MatchCard";
import useBinderPage from "./useBinderPage";

const matchId = (match: BinderMatch) => itemIdentity(match);

export default function MatchesView() {
  const loader = useCallback((page: number) => binderApi.matches(page), []);
  const resource = useBinderPage("matches", loader, matchId);
  const [selected, setSelected] = useState<BinderItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  async function send(type: InterestType, quantity: number, message: string | null) {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      await binderApi.createInterest(selected.id, type, quantity, message);
      setSentIds((ids) => new Set(ids).add(selected.id));
      setSelected(null);
    } catch (caught) {
      setError(binderErrorMessage(caught, "Interest could not be sent."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="matches-title">
      <div><h2 id="matches-title" className="text-lg font-bold">Matches</h2><p className="mt-1 text-sm text-muted-foreground">Public active listings that satisfy your Wanted List preferences.</p></div>
      <div className="mt-5">
        {resource.loading ? <BinderLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title="No matches yet" detail="Add active Wanted List cards or check back after other players update their Binders." /> : null}
        {resource.items.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">{resource.items.map((match) => <MatchCard key={matchId(match)} match={match} busy={sentIds.has(match.binder_item.id)} onInterest={() => { setError(null); setSelected(match.binder_item); }} />)}</div> : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
      <InterestDialog item={selected} saving={saving} error={error} onClose={() => setSelected(null)} onSubmit={send} />
    </section>
  );
}
