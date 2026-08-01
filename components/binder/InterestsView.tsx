"use client";

import { useCallback, useState } from "react";

import type { BinderInterest, InterestView } from "@/lib/binder";
import { binderApi, binderErrorMessage } from "@/services/binder";

import { BinderEmpty, BinderError, LoadMore } from "./BinderFeedback";
import InterestRow from "./InterestRow";
import useBinderPage from "./useBinderPage";

const byId = (interest: BinderInterest) => interest.id;

export default function InterestsView({ view }: { view: InterestView }) {
  const loader = useCallback((page: number) => binderApi.interests(view, page), [view]);
  const resource = useBinderPage(`interests:${view}`, loader, byId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function transition(interest: BinderInterest, action: "accept" | "decline" | "withdraw") {
    if (busyId) return;
    setBusyId(interest.id);
    setErrors((current) => ({ ...current, [interest.id]: "" }));
    try {
      if (action === "withdraw") {
        await binderApi.withdrawInterest(interest.id);
        resource.updateItems((items) => items.map((item) => item.id === interest.id ? { ...item, status: "withdrawn" } : item));
      } else {
        const updated = action === "accept"
          ? await binderApi.acceptInterest(interest.id)
          : await binderApi.declineInterest(interest.id);
        resource.updateItems((items) => items.map((item) => item.id === updated.id ? updated : item));
      }
    } catch (error) {
      setErrors((current) => ({ ...current, [interest.id]: binderErrorMessage(error, `Interest could not be ${action === "withdraw" ? "withdrawn" : `${action}ed`}.`) }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby={`${view}-interests-title`}>
      <div><h2 id={`${view}-interests-title`} className="text-lg font-bold">{view === "received" ? "Received interests" : "Sent interests"}</h2><p className="mt-1 text-sm text-muted-foreground">{view === "received" ? "Requests from players interested in your active listings." : "Requests you have sent to other players."}</p></div>
      <div className="mt-5">
        {resource.loading ? <div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-row bg-muted" />)}</div> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title={`No ${view} interests`} detail={view === "received" ? "New interest requests will appear here." : "Interest requests you send will appear here."} /> : null}
        {resource.items.length ? <div className="space-y-3">{resource.items.map((interest) => <InterestRow key={interest.id} interest={interest} view={view} busy={busyId === interest.id} error={errors[interest.id]} onAccept={() => void transition(interest, "accept")} onDecline={() => void transition(interest, "decline")} onWithdraw={() => void transition(interest, "withdraw")} />)}</div> : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
    </section>
  );
}
