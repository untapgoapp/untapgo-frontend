/* eslint-disable @next/next/no-img-element */

import { Edit3, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CARD_LANGUAGE_LABELS, CONDITION_LABELS, FINISH_LABELS, type WantedCard } from "@/lib/binder";

export default function WantedCardRow({ card, owner = true, busy, error, onEdit, onRemove }: {
  card: WantedCard;
  owner?: boolean;
  busy?: boolean;
  error?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  return (
    <article className="flex min-w-0 gap-4 rounded-row px-1 py-3 sm:gap-5">
      <div className="w-20 shrink-0 sm:w-24">{card.image_url ? <img src={card.image_url} alt={card.card_name} className="w-full rounded-[0.45rem]" /> : <div className="aspect-[0.714] rounded-row bg-muted" />}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h3 className="font-bold">{card.card_name}</h3><p className="mt-1 text-sm text-muted-foreground">{card.preferred_scryfall_card_id ? `${card.preferred_set_code?.toUpperCase()} · #${card.preferred_collector_number}` : "Any printing"}</p></div>
          <Badge variant={card.status === "active" ? "default" : "secondary"}>{card.status}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs"><Badge variant="secondary">Quantity {card.quantity}</Badge>{card.minimum_condition ? <Badge variant="outline">{CONDITION_LABELS[card.minimum_condition]} or better</Badge> : null}{card.preferred_language ? <Badge variant="outline">{CARD_LANGUAGE_LABELS[card.preferred_language] ?? card.preferred_language.toUpperCase()}</Badge> : null}{card.preferred_finish ? <Badge variant="outline">{FINISH_LABELS[card.preferred_finish]}</Badge> : null}</div>
        {card.notes ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.notes}</p> : null}
        {owner && card.status !== "removed" ? <div className="mt-3 flex gap-1"><Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onEdit}><Edit3 aria-hidden="true" />Edit</Button><Button type="button" size="xs" variant="destructive" disabled={busy} onClick={onRemove}><Trash2 aria-hidden="true" />Remove</Button></div> : null}
        {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </article>
  );
}
