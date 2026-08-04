"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Share2 } from "lucide-react";
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
import { shareBinderLink } from "@/lib/binder-share";
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
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(`/profile/${ownerId}/binder`)}`);
      } else {
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [ownerId, router]);

  if (!ready) {
    return (
      <main className="min-h-screen px-4 py-8 lg:px-0">
        <div className="h-56 animate-pulse rounded-surface bg-muted" />
      </main>
    );
  }

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
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const scope = `${ownerId}:${JSON.stringify(filters)}`;

  const loader = useCallback(
    async (page: number) => {
      try {
        const response = await binderApi.publicItems(ownerId, filters, page);
        setOwner(response.owner);
        setUnavailable(false);
        return response;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setUnavailable(true);
        }
        throw error;
      }
    },
    [scope], // eslint-disable-line react-hooks/exhaustive-deps
  );

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

  async function share() {
    if (!owner || sharing) return;
    setSharing(true);
    setShareStatus(null);
    try {
      const outcome = await shareBinderLink({ ownerId: owner.id, nickname: owner.nickname });
      if (outcome === "copied") setShareStatus("Binder link copied.");
      if (outcome === "shared") setShareStatus("Binder shared.");
    } catch {
      setShareStatus("Binder link could not be shared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  if (unavailable) {
    return (
      <main className="min-h-screen px-4 py-8 lg:px-0">
        <div className="max-w-[1050px] rounded-surface bg-surface-subtle p-6">
          <h1 className="text-xl font-bold">Binder unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This Binder is private or unavailable.
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link href={`/profile/${encodeURIComponent(ownerId)}`}>
              <ArrowLeft aria-hidden="true" />
              Back to profile
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1120px]">
        <header className="pb-6">
          <Link
            href={`/profile/${encodeURIComponent(ownerId)}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to profile
          </Link>

          {owner ? (
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={owner.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{owner.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-bold tracking-[-0.035em]">
                    {owner.nickname}&apos;s Binder
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Available cards for trade or sale.
                  </p>
                  {owner.location?.display_name ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin aria-hidden="true" className="h-4 w-4" />
                      {owner.location.display_name}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Button type="button" variant="outline" size="sm" disabled={sharing} onClick={() => void share()}>
                  <Share2 aria-hidden="true" />
                  {sharing ? "Sharing…" : "Share Binder"}
                </Button>
                {shareStatus ? (
                  <p role="status" className="max-w-64 text-right text-xs text-muted-foreground">
                    {shareStatus}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </header>

        <section aria-labelledby="available-cards-title">
          <h2 id="available-cards-title" className="text-xl font-bold">
            Available cards
          </h2>
          <div className="mt-4">
            <BinderFilters value={filters} onChange={setFilters} />
          </div>
          <div className="mt-6">
            {resource.loading ? <BinderLoading /> : null}
            {resource.error && !unavailable ? (
              <BinderError message="This Binder could not be loaded." onRetry={resource.retry} />
            ) : null}
            {!resource.loading && !resource.error && !resource.items.length ? (
              <BinderEmpty title="No available cards" detail="No active listings match these filters." />
            ) : null}
            {resource.items.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {resource.items.map((item) => (
                  <BinderCard
                    key={item.id}
                    item={item}
                    busy={sentIds.has(item.id)}
                    onInterest={() => {
                      setInterestError(null);
                      setSelected(item);
                    }}
                  />
                ))}
              </div>
            ) : null}
            {resource.hasMore ? (
              <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} />
            ) : null}
          </div>
        </section>

        {owner ? (
          <div className="mt-10">
            <PublicWantedList ownerId={owner.id} />
          </div>
        ) : null}
      </div>

      <InterestDialog
        item={selected}
        saving={sending}
        error={interestError}
        onClose={() => setSelected(null)}
        onSubmit={sendInterest}
      />
    </main>
  );
}
