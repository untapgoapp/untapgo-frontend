"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type CommunityBinderItem, type InterestType } from "@/lib/binder";
import { binderApi, binderErrorMessage } from "@/services/binder";
import { useUser } from "@/hooks/useUser";

import BinderCard from "./BinderCard";
import InterestDialog from "./InterestDialog";

export default function PublicBinderItem({ itemId }: { itemId: string }) {
  const { user } = useUser();
  const [item, setItem] = useState<CommunityBinderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    void binderApi.publicItem(itemId).then((result) => {
      if (active) setItem(result);
    }).catch((caught) => {
      if (active) setError(binderErrorMessage(caught, "This Binder card is unavailable."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [itemId]);

  async function sendInterest(type: InterestType, quantity: number, message: string | null) {
    if (!item || sending) return;
    setSending(true);
    setError(null);
    try {
      await binderApi.createInterest(item.id, type, quantity, message);
      setDialog(false);
    } catch (caught) {
      setError(binderErrorMessage(caught, "Interest could not be sent."));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <main className="min-h-screen px-4 py-8 lg:px-0"><div className="h-96 animate-pulse rounded-surface bg-muted" /></main>;
  if (!item) return <main className="min-h-screen px-4 py-8 lg:px-0"><p className="text-sm text-destructive">{error ?? "Card unavailable."}</p></main>;

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[720px]">
        <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost" size="sm"><Link href={`/profile/${encodeURIComponent(item.owner.id)}?tab=binder`}><ArrowLeft aria-hidden="true" />Back to {item.owner.nickname}&apos;s Binder</Link></Button><Button type="button" variant="outline" size="sm" onClick={() => void shareItem(item)}><Share2 aria-hidden="true" />Share card</Button></div>
        <div className="mt-6 max-w-[15rem]"><BinderCard item={item} onInterest={user?.id === item.owner.id ? undefined : () => setDialog(true)} footer={<p className="mt-2 text-xs font-semibold">Listed by <Link href={`/profile/${encodeURIComponent(item.owner.id)}`} className="text-primary hover:underline">{item.owner.nickname}</Link></p>} /></div>
        {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
      </div>
      <InterestDialog item={dialog ? item : null} saving={sending} error={error} onClose={() => setDialog(false)} onSubmit={sendInterest} />
    </main>
  );
}

async function shareItem(item: CommunityBinderItem) {
  const url = window.location.href;
  const title = item.printed_name || item.card_name;
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  await navigator.clipboard.writeText(url);
}
