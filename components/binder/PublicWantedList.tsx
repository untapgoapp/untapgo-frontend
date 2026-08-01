"use client";

import { useCallback, useState } from "react";

import type { WantedCard } from "@/lib/binder";
import { ApiError, binderApi } from "@/services/binder";

import { LoadMore } from "./BinderFeedback";
import useBinderPage from "./useBinderPage";
import WantedCardRow from "./WantedCardRow";

const byId = (card: WantedCard) => card.id;

export default function PublicWantedList({ ownerId }: { ownerId: string }) {
  const [hidden, setHidden] = useState(false);
  const loader = useCallback(async (page: number) => {
    try {
      return await binderApi.publicWanted(ownerId, page);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setHidden(true);
      throw error;
    }
  }, [ownerId]);
  const resource = useBinderPage(`public-wanted:${ownerId}`, loader, byId);

  if (hidden || (!resource.loading && !resource.items.length)) return null;
  return (
    <section id="wanted-list" aria-labelledby="public-wanted-title" className="scroll-mt-6 border-t border-border/70 pt-8">
      <h2 id="public-wanted-title" className="text-xl font-bold">Wanted List</h2>
      <p className="mt-1 text-sm text-muted-foreground">Cards this player is looking for.</p>
      {resource.loading ? <div className="mt-5 h-32 animate-pulse rounded-row bg-muted" /> : null}
      {resource.items.length ? <div className="mt-4 grid gap-x-6 md:grid-cols-2">{resource.items.map((card) => <WantedCardRow key={card.id} card={card} owner={false} />)}</div> : null}
      {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
    </section>
  );
}
