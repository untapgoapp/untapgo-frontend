/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import {
  getPlayerProfileHref,
  type PlayerDirectoryItem,
} from "@/lib/player-directory";

export default function PlayerDirectoryRow({
  player,
}: {
  player: PlayerDirectoryItem;
}) {
  const nickname = player.nickname.trim() || "Player";
  const bio = player.bio?.trim() || null;
  const arenaUsername = player.mtg_arena_username?.trim() || null;

  return (
    <article className="min-w-0">
      <Link
        href={getPlayerProfileHref(player.id)}
        className="group flex h-full min-h-[88px] items-center gap-3 rounded-row px-3 py-3.5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary/70 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/20 sm:px-4"
        aria-label={`View ${nickname}'s profile`}
      >
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
          {player.avatar_url ? (
            <img src={player.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-lg font-bold text-primary">
              {nickname.slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground group-hover:text-secondary-foreground">
            {nickname}
          </span>
          {bio ? (
            <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{bio}</span>
          ) : null}
          {arenaUsername ? (
            <span className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-primary">
              <Gamepad2 size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">MTG Arena · {arenaUsername}</span>
            </span>
          ) : null}
        </span>
      </Link>
    </article>
  );
}
