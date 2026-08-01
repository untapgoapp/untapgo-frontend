/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Check, Edit3, Handshake, Pause, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  FINISH_LABELS,
  formatAskingPrice,
  type BinderItem,
} from "@/lib/binder";

export default function BinderCard({
  item,
  owner,
  busy = false,
  error,
  href,
  onEdit,
  onStatus,
  onWithdraw,
  onInterest,
}: {
  item: BinderItem;
  owner?: boolean;
  busy?: boolean;
  error?: string | null;
  href?: string;
  onEdit?: () => void;
  onStatus?: (status: BinderItem["status"]) => void;
  onWithdraw?: () => void;
  onInterest?: () => void;
}) {
  const price = formatAskingPrice(item);
  const image = item.image_url ? (
    <img src={item.image_url} alt={item.card_name} className="aspect-[0.714] w-full rounded-[0.7rem] object-cover" />
  ) : <div className="grid aspect-[0.714] place-items-center rounded-surface bg-muted px-4 text-center text-sm text-muted-foreground">{item.card_name}</div>;

  return (
    <article className="min-w-0">
      {href ? <Link href={href} className="block outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">{image}</Link> : image}
      <div className="px-0.5 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-sm font-bold leading-5">{item.card_name}</h3>
          {item.quantity > 1 ? <Badge variant="secondary">×{item.quantity}</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{item.set_code.toUpperCase()} · #{item.collector_number} · {item.language.toUpperCase()}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{CONDITION_LABELS[item.condition]}</Badge>
          <Badge variant="secondary">{FINISH_LABELS[item.finish]}</Badge>
          <Badge variant="outline">{AVAILABILITY_LABELS[item.availability]}</Badge>
          {owner && item.status !== "active" ? <Badge variant={item.status === "withdrawn" ? "destructive" : "secondary"}>{item.status}</Badge> : null}
        </div>
        {price ? <p className="mt-2 text-sm font-semibold">Asking price · {price}</p> : null}
        {item.notes ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{item.notes}</p> : null}
        {onInterest ? <Button type="button" size="sm" variant="secondary" className="mt-3 w-full" disabled={busy} onClick={onInterest}><Handshake aria-hidden="true" />I&apos;m interested</Button> : null}
        {owner ? (
          <div className="mt-3 flex flex-wrap gap-1">
            <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onEdit}><Edit3 aria-hidden="true" />Edit</Button>
            {item.status === "active" ? <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => onStatus?.("reserved")}><Pause aria-hidden="true" />Reserve</Button> : null}
            {item.status !== "completed" && item.status !== "withdrawn" ? <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => onStatus?.("completed")}><Check aria-hidden="true" />Complete</Button> : null}
            {item.status !== "active" && item.status !== "withdrawn" ? <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => onStatus?.("active")}><RotateCcw aria-hidden="true" />Reactivate</Button> : null}
            {item.status !== "withdrawn" ? <Button type="button" size="xs" variant="destructive" disabled={busy} onClick={onWithdraw}><X aria-hidden="true" />Withdraw</Button> : null}
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </article>
  );
}
