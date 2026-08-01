/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Bookmark, BookmarkCheck, LibraryBig } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ManaIdentity } from "@/components/magic/mana-symbols";
import { deckRoutes } from "@/lib/deck-routes";
import type { CommunityDeck } from "@/types/decks";

function formatDate(value: string | null): string {
  if (!value) return "Recently updated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function DeckDiscoveryCard({ deck, busy, error, onToggleSaved }: {
  deck: CommunityDeck;
  busy: boolean;
  error?: string;
  onToggleSaved: () => void;
}) {
  const href = deckRoutes.publicDetail(deck.owner.id, deck.id);
  return (
    <article className="min-w-0 overflow-hidden rounded-surface border border-border/65 bg-surface">
      <Link href={href} className="block aspect-[1.55] overflow-hidden bg-secondary outline-none focus-visible:ring-inset focus-visible:ring-[3px] focus-visible:ring-ring/20">
        {deck.image_url ? <img src={deck.image_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-primary"><LibraryBig aria-hidden="true" className="h-7 w-7" /></span>}
      </Link>
      <div className="p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="truncate text-base font-bold">{deck.name}</h2><p className="mt-1 text-xs text-muted-foreground">{deck.format_slug || "No format"} · {deck.card_count} cards</p></div>
          <ManaIdentity colors={deck.color_identity.length ? deck.color_identity : ["C"]} size="sm" />
        </div>
        <div className="mt-4 flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7"><AvatarImage src={deck.owner.avatar_url ?? undefined} alt="" /><AvatarFallback>{deck.owner.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><Link href={`/profile/${encodeURIComponent(deck.owner.id)}`} className="block truncate text-xs font-semibold hover:text-primary">{deck.owner.nickname}</Link><p className="mt-0.5 text-[11px] text-quiet-foreground">Updated {formatDate(deck.updated_at)}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" size="sm" variant={deck.is_saved ? "secondary" : "outline"} disabled={busy} onClick={onToggleSaved}>{deck.is_saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}{deck.is_saved ? "Saved" : "Save"}</Button>
          <Button asChild size="sm"><Link href={href}>Open</Link></Button>
        </div>
        {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </article>
  );
}
