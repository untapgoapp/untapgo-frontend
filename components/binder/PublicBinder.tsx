"use client";

import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  type BinderFilters as BinderFilterValues,
  type BinderItem,
  type BinderUser,
  type InterestType,
} from "@/lib/binder";
import { supabase } from "@/lib/supabase/client";
import { ApiError, binderApi, binderErrorMessage } from "@/services/binder";

import BinderCard from "./BinderCard";
import { BinderEmpty, BinderError, BinderLoading, LoadMore } from "./BinderFeedback";
import BinderFilters, { EMPTY_BINDER_FILTERS } from "./BinderFilters";
import InterestDialog from "./InterestDialog";
import PublicWantedList from "./PublicWantedList";
import useBinderPage from "./useBinderPage";

const byId = (item: BinderItem) => item.id;

export default function PublicBinder({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) router.replace(`/login?next=${encodeURIComponent(`/profile/${ownerId}/binder`)}`);
      else setReady(true);
    });
    return () => { active = false; };
  }, [ownerId, router]);
  if (!ready) return <main className="min-h-screen px-4 py-8 lg:px-0"><div className="h-56 animate-pulse rounded-surface bg-muted" /></main>;
  return <AuthenticatedPublicBinder ownerId={ownerId} />;
}

function AuthenticatedPublicBinder({ ownerId }: { ownerId: string }) {
  const [filters, setFilters] = useState<BinderFilterValues>(EMPTY_BINDER_FILTERS);
  const [owner, setOwner] = useState<BinderUser | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [selected, setSelected] = useState<BinderItem | null>(null);
  const [sending, setSending] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const scope = `${ownerId}:${JSON.stringify(filters)}`;
  const loader = useCallback(async (page: number) => {
    try {
      const response = await binderApi.publicItems(ownerId, filters, page);
      setOwner(response.owner);
      setUnavailable(false);
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setUnavailable(true);
      throw error;
    }
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps
  const resource = useBinderPage(scope, loader, byId);

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

  if (unavailable) return (
    <main className="min-h-screen px-4 py-8 lg:px-0"><div className="max-w-[1050px] rounded-surface bg-surface-subtle p-6"><h1 className="text-xl font-bold">Binder unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This Binder is private or unavailable.</p><Button asChild variant="ghost" size="sm" className="mt-4"><Link href={`/profile/${encodeURIComponent(ownerId)}`}><ArrowLeft aria-hidden="true" />Back to profile</Link></Button></div></main>
  );

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1120px]">
        <header className="pb-6">
          <Link href={`/profile/${encodeURIComponent(ownerId)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={15} aria-hidden="true" />Back to profile</Link>
          {owner ? <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><Avatar className="h-14 w-14"><AvatarImage src={owner.avatar_url ?? undefined} alt="" /><AvatarFallback>{owner.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div><p className="text-sm font-semibold text-primary">{owner.nickname}</p><h1 className="text-3xl font-bold tracking-[-0.035em]">Binder</h1></div></div><Button type="button" variant="outline" size="sm" onClick={() => void sharePublicBinder(owner.id, owner.nickname)}><Share2 aria-hidden="true" />Share Binder</Button></div> : null}
        </header>
        <section aria-labelledby="available-cards-title">
          <h2 id="available-cards-title" className="text-xl font-bold">Available cards</h2>
          <div className="mt-4"><BinderFilters value={filters} onChange={setFilters} /></div>
          <div className="mt-6">
            {resource.loading ? <BinderLoading /> : null}
            {resource.error && !unavailable ? <BinderError message="This Binder could not be loaded." onRetry={resource.retry} /> : null}
            {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title="No available cards" detail="No active listings match these filters." /> : null}
            {resource.items.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{resource.items.map((item) => <BinderCard key={item.id} item={item} busy={sentIds.has(item.id)} onInterest={() => { setInterestError(null); setSelected(item); }} />)}</div> : null}
            {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
          </div>
        </section>
        {owner ? <div className="mt-10"><PublicWantedList ownerId={owner.id} /></div> : null}
      </div>
      <InterestDialog item={selected} saving={sending} error={interestError} onClose={() => setSelected(null)} onSubmit={sendInterest} />
    </main>
  );
}

async function sharePublicBinder(ownerId: string, nickname: string) {
  const url = `${window.location.origin}/profile/${encodeURIComponent(ownerId)}?tab=binder`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${nickname}'s UntapGo Binder`, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  await navigator.clipboard.writeText(url);
}
