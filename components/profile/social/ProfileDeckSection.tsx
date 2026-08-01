/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ExternalLink, LibraryBig } from "lucide-react";

import { ManaIdentity } from "@/components/magic/mana-symbols";

import type { ProfileDeckView } from "./profile-view-data";

type ProfileDeckSectionProps = {
  decks: ProfileDeckView[] | null;
  failed: boolean;
  isOwner: boolean;
  publicDecksVisible?: boolean | null;
};

function formatLabel(value: string): string {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DeckRow({ deck }: { deck: ProfileDeckView }) {
  const details = (
    <>
      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-control bg-secondary">
        {deck.imageUrl ? (
          <img src={deck.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-primary">
            <LibraryBig size={20} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate text-sm font-bold text-zinc-900">{deck.name}</h3>
          {deck.isPublic !== null ? (
            <span className="text-[10px] font-semibold text-quiet-foreground">
              {deck.isPublic ? "Public" : "Private"}
            </span>
          ) : null}
        </div>
        {deck.commander ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Commander: {deck.commander}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {deck.format ? (
            <span className="text-xs font-medium text-primary">{formatLabel(deck.format)}</span>
          ) : null}
          <ManaIdentity colors={deck.colors.length > 0 ? deck.colors : ["C"]} size="sm" />
        </div>
      </div>
    </>
  );

  return (
    <article className="rounded-row px-2 py-3.5 transition-colors hover:bg-surface sm:px-3">
      <div className="flex items-center gap-3">
        {details}
        {deck.href ? (
          deck.external ? (
            <a
              href={deck.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Open <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : (
            <Link href={deck.href} className="shrink-0 text-xs font-semibold text-primary hover:underline">
              Open
            </Link>
          )
        ) : null}
      </div>

      {deck.exportText ? (
        <details className="ml-[4.75rem] mt-2 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-primary">
            View deck list
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border-l-2 border-secondary pl-3 text-xs leading-5 text-muted-foreground">
            {deck.exportText}
          </pre>
        </details>
      ) : null}
    </article>
  );
}

function DeckSkeletons() {
  return Array.from({ length: 3 }, (_, index) => (
    <div key={index} className="flex animate-pulse items-center gap-3 px-3 py-4">
      <div className="h-14 w-16 rounded-md bg-black/[0.07]" />
      <div className="flex-1">
        <div className="h-4 w-1/2 rounded bg-black/10" />
        <div className="mt-2 h-3 w-1/3 rounded bg-black/[0.06]" />
      </div>
    </div>
  ));
}

export default function ProfileDeckSection({
  decks,
  failed,
  isOwner,
  publicDecksVisible,
}: ProfileDeckSectionProps) {
  const visibleDecks = decks?.slice(0, 6) ?? null;

  return (
    <section id="decks" aria-labelledby="profile-decks-title" className="scroll-mt-6 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="profile-decks-title" className="text-lg font-semibold tracking-tight">Decks</h2>
          <p className="mt-1 text-sm text-muted-foreground">Decks this player brings to the table.</p>
        </div>
        {isOwner ? (
          <Link href="/profile/decks" className="shrink-0 text-sm font-semibold text-primary hover:underline">
            Manage decks
          </Link>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
        {decks === null && !failed ? <DeckSkeletons /> : null}
        {failed ? <p className="rounded-row bg-surface-subtle px-3 py-4 text-sm text-muted-foreground">Decks could not be loaded right now.</p> : null}
        {!failed && visibleDecks?.map((deck) => <DeckRow key={deck.id} deck={deck} />)}
        {!failed && visibleDecks?.length === 0 ? (
          <p className="rounded-row px-3 py-4 text-sm text-muted-foreground">
            {!isOwner && publicDecksVisible === false
              ? "This player keeps their decks private."
              : isOwner
                ? "No decks yet. Add one from deck management."
                : "No public decks yet."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
