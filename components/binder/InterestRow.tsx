/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Check, Undo2, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTEREST_LABELS, type BinderInterest, type InterestView } from "@/lib/binder";

export default function InterestRow({ interest, view, busy, error, onAccept, onDecline, onWithdraw }: {
  interest: BinderInterest;
  view: InterestView;
  busy: boolean;
  error?: string | null;
  onAccept?: () => void;
  onDecline?: () => void;
  onWithdraw?: () => void;
}) {
  const userHref = `/profile/${encodeURIComponent(interest.other_user.id)}`;
  return (
    <article className="grid gap-4 rounded-row bg-surface/55 p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-start">
      {interest.binder_item.image_url ? <img src={interest.binder_item.image_url} alt={interest.binder_item.card_name} className="w-16 rounded-[0.4rem]" /> : <div className="aspect-[0.714] w-16 rounded-row bg-muted" />}
      <div className="min-w-0">
        <Link href={userHref} className="inline-flex max-w-full items-center gap-2 text-sm font-semibold hover:text-primary">
          <Avatar className="h-7 w-7"><AvatarImage src={interest.other_user.avatar_url ?? undefined} alt="" /><AvatarFallback>{interest.other_user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          <span className="truncate">{interest.other_user.nickname}</span>
        </Link>
        <h3 className="mt-2 font-bold">{interest.binder_item.card_name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5"><Badge>{INTEREST_LABELS[interest.interest_type]}</Badge><Badge variant={interest.status === "pending" ? "secondary" : "outline"}>{interest.status}</Badge></div>
        {interest.message ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{interest.message}</p> : <p className="mt-3 text-sm text-quiet-foreground">No message added.</p>}
        {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
      {interest.status === "pending" ? (
        <div className="flex gap-1 sm:flex-col">
          {view === "received" ? <><Button type="button" size="xs" disabled={busy} onClick={onAccept}><Check aria-hidden="true" />Accept</Button><Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onDecline}><X aria-hidden="true" />Decline</Button></> : <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onWithdraw}><Undo2 aria-hidden="true" />Withdraw</Button>}
        </div>
      ) : null}
    </article>
  );
}
