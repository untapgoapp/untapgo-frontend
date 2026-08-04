"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useCallback, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommunityBinderFilters as FilterValues, CommunityBinderItem, CommunityBinderResponse, InterestType } from "@/lib/binder";
import { binderApi, binderErrorMessage } from "@/services/binder";

import BinderCard from "./BinderCard";
import { BinderEmpty, BinderError, BinderLoading, LoadMore } from "./BinderFeedback";
import CommunityBinderFilters, { EMPTY_COMMUNITY_BINDER_FILTERS } from "./CommunityBinderFilters";
import InterestDialog from "./InterestDialog";
import useBinderPage from "./useBinderPage";

const byId = (item: CommunityBinderItem) => item.id;

export default function CommunityBinderView() {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_COMMUNITY_BINDER_FILTERS);
  const [selected, setSelected] = useState<CommunityBinderItem | null>(null);
  const [sending, setSending] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const scope = JSON.stringify(filters);
  const loader = useCallback((page: number) => binderApi.community(filters, page), [filters]);
  const resource = useBinderPage(scope, loader, byId);
  const response = resource.response as CommunityBinderResponse | null;

  async function sendInterest(type: InterestType, message: string | null) {
    if (!selected || sending) return;
    setSending(true);
    setInterestError(null);
    try {
      await binderApi.createInterest(selected.id, type, message);
      setSentIds((ids) => new Set(ids).add(selected.id));
      setSelected(null);
    } catch (error) {
      setInterestError(binderErrorMessage(error, "Interest could not be sent."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="community-binder-results">
      <h2 id="community-binder-results" className="sr-only">Community Binder listings</h2>
      <CommunityBinderFilters value={filters} onChange={setFilters} />
      {response?.nearest_fallback ? <p role="status" className="mt-3 text-xs text-muted-foreground">Add your approximate location to see nearby cards. Showing recently added listings instead.</p> : null}
      <div className="mt-6">
        {resource.loading ? <BinderLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title="No community cards found" detail="Try clearing a filter or searching for another card." /> : null}
        {resource.items.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {resource.items.map((item) => (
              <BinderCard
                key={item.id}
                item={item}
                href={`/profile/${encodeURIComponent(item.owner.id)}/binder`}
                busy={sentIds.has(item.id)}
                onInterest={() => { setInterestError(null); setSelected(item); }}
                footer={<OwnerContext item={item} />}
              />
            ))}
          </div>
        ) : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
      <InterestDialog item={selected} saving={sending} error={interestError} onClose={() => setSelected(null)} onSubmit={sendInterest} />
    </section>
  );
}

function OwnerContext({ item }: { item: CommunityBinderItem }) {
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-border/60 pt-3">
      <Avatar className="h-7 w-7"><AvatarImage src={item.owner.avatar_url ?? undefined} alt="" /><AvatarFallback>{item.owner.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${encodeURIComponent(item.owner.id)}`} className="block truncate text-xs font-semibold hover:text-primary">{item.owner.nickname}</Link>
        {item.proximity ? <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin aria-hidden="true" className="h-3 w-3" />{item.proximity.label}</span> : null}
      </div>
    </div>
  );
}
