/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { getPlayerProfileHref, type PlayerDirectoryItem } from "@/lib/player-directory";

import PlayerRelationshipAction from "./PlayerRelationshipAction";

export default function PlayerDirectoryRow({
  player,
  busy = false,
  blocked = false,
  error,
  onToggle,
}: {
  player: PlayerDirectoryItem;
  busy?: boolean;
  blocked?: boolean;
  error?: string;
  onToggle?: (player: PlayerDirectoryItem) => void | Promise<void>;
}) {
  const nickname = player.nickname.trim() || "Player";
  const bio = player.bio?.trim() || null;
  const arenaUsername = player.mtg_arena_username?.trim() || null;

  return (
    <article className="flex min-h-20 min-w-0 items-center gap-2 rounded-row px-3 py-2.5 transition-colors hover:bg-secondary/45 focus-within:bg-secondary/45 sm:px-4">
      <Link href={getPlayerProfileHref(player.id)} className="group flex min-w-0 flex-1 items-center gap-3 rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20" aria-label={`View ${nickname}'s profile`}>
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-secondary">
          {player.avatar_url ? <img src={player.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-base font-bold text-primary">{nickname.slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground group-hover:text-secondary-foreground">{nickname}</span>
          {bio ? <span className="mt-0.5 block truncate text-xs leading-5 text-muted-foreground">{bio}</span> : null}
          {arenaUsername ? <span className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs font-medium text-primary"><Gamepad2 size={12} className="shrink-0" aria-hidden="true" /><span className="truncate">{arenaUsername}</span></span> : null}
        </span>
      </Link>
      {onToggle ? <PlayerRelationshipAction relationship={player.relationship} busy={busy} blocked={blocked} error={error} onToggle={() => onToggle(player)} /> : null}
    </article>
  );
}
