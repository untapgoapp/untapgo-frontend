/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { binderDisplayName, type BinderTradeStatus, type BinderTradeThread } from "@/lib/binder";
import { binderApi } from "@/services/binder";

import { BinderEmpty, BinderError, BinderLoading, LoadMore } from "./BinderFeedback";
import useBinderPage from "./useBinderPage";

const byId = (thread: BinderTradeThread) => thread.id;
const statuses: Array<[BinderTradeStatus | "", string]> = [["active", "Active"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["", "All"]];

export default function TradeThreadsView() {
  const [status, setStatus] = useState<BinderTradeStatus | "">("active");
  const loader = useCallback((page: number) => binderApi.trades(page, status), [status]);
  const resource = useBinderPage(`trades:${status}`, loader, byId);

  return (
    <section aria-labelledby="binder-trades-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="binder-trades-title" className="text-lg font-bold">Trade conversations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Private chats created when a Binder request is accepted.</p>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Trade status">
          {statuses.map(([value, label]) => (
            <Button key={label} type="button" size="xs" variant={status === value ? "secondary" : "ghost"} onClick={() => setStatus(value)}>{label}</Button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {resource.loading ? <BinderLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title="No trade conversations" detail="Accept a trade request to open a private conversation." /> : null}
        {resource.items.length ? <div className="space-y-2">{resource.items.map((thread) => <TradeThreadRow key={thread.id} thread={thread} />)}</div> : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
    </section>
  );
}

function TradeThreadRow({ thread }: { thread: BinderTradeThread }) {
  const item = thread.binder_item;
  const title = binderDisplayName(item);
  return (
    <Link href={`/trades/${encodeURIComponent(thread.id)}`} className="grid min-h-20 gap-3 rounded-row px-3 py-3 outline-none hover:bg-secondary/50 focus-visible:bg-secondary sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-center">
      {item.image_url ? <img src={item.image_url} alt="" className="h-16 w-11 rounded-[0.3rem] object-cover" /> : <div className="h-16 w-11 rounded-[0.3rem] bg-muted" />}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7"><AvatarImage src={thread.other_user.avatar_url ?? undefined} alt="" /><AvatarFallback>{thread.other_user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          <span className="truncate text-sm font-semibold">{thread.other_user.nickname}</span>
          <Badge variant={thread.status === "active" ? "secondary" : "outline"} className="shrink-0 text-[10px]">{thread.status}</Badge>
        </div>
        <p className="mt-1 truncate text-sm font-bold">{title} · {thread.requested_quantity ?? 1} {(thread.requested_quantity ?? 1) === 1 ? "copy" : "copies"}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{thread.last_message?.body ?? "Open the conversation"}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {thread.unread_count > 0 ? <Badge>{thread.unread_count}</Badge> : null}
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
      </div>
    </Link>
  );
}
