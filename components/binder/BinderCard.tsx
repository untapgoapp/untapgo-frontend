/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Edit3, Handshake, MoreHorizontal, Pause, RotateCcw, Share2, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AVAILABILITY_LABELS,
  CARD_LANGUAGE_LABELS,
  CONDITION_LABELS,
  FINISH_LABELS,
  binderDisplayName,
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
  onRemove,
  onShare,
  onInterest,
  footer,
}: {
  item: BinderItem;
  owner?: boolean;
  busy?: boolean;
  error?: string | null;
  href?: string;
  onEdit?: () => void;
  onStatus?: (status: BinderItem["status"]) => void;
  onWithdraw?: () => void;
  onRemove?: () => void;
  onShare?: () => void;
  onInterest?: () => void;
  footer?: ReactNode;
}) {
  const displayName = binderDisplayName(item);
  const price = formatAskingPrice(item);
  const image = item.image_url ? (
    <img src={item.image_url} alt={displayName} className="aspect-[0.714] w-full rounded-[0.58rem] object-cover" />
  ) : <div className="grid aspect-[0.714] place-items-center rounded-[0.58rem] bg-muted px-3 text-center text-xs text-muted-foreground">{displayName}</div>;

  return (
    <article className="min-w-0">
      {href ? <Link href={href} className="block outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">{image}</Link> : image}
      <div className="px-0.5 pt-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold leading-5" title={displayName}>{displayName}</h3>
            {item.printed_name && item.printed_name !== item.card_name ? <p className="truncate text-[10px] text-quiet-foreground">{item.card_name}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {item.quantity > 1 ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">×{item.quantity}</Badge> : null}
            {owner ? <OwnerItemMenu item={item} busy={busy} onEdit={onEdit} onStatus={onStatus} onWithdraw={onWithdraw} onRemove={onRemove} onShare={onShare} /> : null}
          </div>
        </div>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {item.set_code.toUpperCase()} · #{item.collector_number} · {CARD_LANGUAGE_LABELS[item.language] ?? item.language.toUpperCase()}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <Badge className="px-1.5 py-0 text-[10px]">{CONDITION_LABELS[item.condition]}</Badge>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{FINISH_LABELS[item.finish]}</Badge>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{AVAILABILITY_LABELS[item.availability]}</Badge>
          {owner && item.status !== "active" ? <Badge variant={item.status === "withdrawn" ? "destructive" : "secondary"} className="px-1.5 py-0 text-[10px]">{item.status}</Badge> : null}
        </div>
        {price ? <p className="mt-1.5 text-xs font-semibold">{price}</p> : null}
        {item.notes ? <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{item.notes}</p> : null}
        {footer}
        {onInterest ? <Button type="button" size="xs" variant="secondary" className="mt-2.5 w-full" disabled={busy} onClick={onInterest}><Handshake aria-hidden="true" />I&apos;m interested</Button> : null}
        {error ? <p role="alert" className="mt-2 text-[11px] text-destructive">{error}</p> : null}
      </div>
    </article>
  );
}

function OwnerItemMenu({
  item,
  busy,
  onEdit,
  onStatus,
  onWithdraw,
  onRemove,
  onShare,
}: {
  item: BinderItem;
  busy: boolean;
  onEdit?: () => void;
  onStatus?: (status: BinderItem["status"]) => void;
  onWithdraw?: () => void;
  onRemove?: () => void;
  onShare?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", keydown);
    };
  }, [open]);

  function run(action?: () => void) {
    setOpen(false);
    action?.();
  }

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" aria-label={`Actions for ${binderDisplayName(item)}`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/15">
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.25rem)] z-30 w-48 rounded-control border border-border bg-surface p-1 shadow-overlay">
          <MenuButton icon={<Edit3 />} label="Edit listing" disabled={busy} onClick={() => run(onEdit)} />
          {onShare ? <MenuButton icon={<Share2 />} label="Share card" disabled={busy} onClick={() => run(onShare)} /> : null}
          {item.status === "active" ? <MenuButton icon={<Pause />} label="Reserve" disabled={busy} onClick={() => run(() => onStatus?.("reserved"))} /> : null}
          {item.status !== "completed" && item.status !== "withdrawn" ? <MenuButton icon={<Check />} label="Mark completed" disabled={busy} onClick={() => run(() => onStatus?.("completed"))} /> : null}
          {item.status !== "active" && item.status !== "withdrawn" ? <MenuButton icon={<RotateCcw />} label="Reactivate" disabled={busy} onClick={() => run(() => onStatus?.("active"))} /> : null}
          {item.status !== "withdrawn" ? <MenuButton icon={<X />} label="Mark unavailable" disabled={busy} onClick={() => run(onWithdraw)} /> : null}
          {onRemove ? <MenuButton icon={<Trash2 />} label="Remove from Binder" destructive disabled={busy} onClick={() => run(onRemove)} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ icon, label, destructive = false, disabled, onClick }: { icon: ReactNode; label: string; destructive?: boolean; disabled: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={`flex min-h-9 w-full items-center gap-2 rounded-control px-2.5 text-left text-xs font-semibold disabled:opacity-50 ${destructive ? "text-destructive hover:bg-destructive/8" : "text-foreground hover:bg-secondary"}`}><span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>{label}</button>;
}
