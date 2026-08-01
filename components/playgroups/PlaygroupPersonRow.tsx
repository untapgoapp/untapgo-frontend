import type { ReactNode } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PlaygroupMember } from "@/services/playgroups";

export default function PlaygroupPersonRow({
  person,
  actions,
  error,
}: {
  person: PlaygroupMember;
  actions?: ReactNode;
  error?: string | null;
}) {
  const nickname = person.nickname.trim() || "Player";
  const bio = person.bio?.trim() || null;
  const arena = person.mtg_arena_username?.trim() || null;

  return (
    <article className="rounded-row transition-colors hover:bg-secondary/45 focus-within:bg-secondary/45">
      <div className="flex min-h-[82px] items-center gap-2 px-3 py-3">
        <Link href={`/profile/${encodeURIComponent(person.id)}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
          <Avatar className="h-12 w-12 bg-secondary">
            {person.avatar_url ? <AvatarImage src={person.avatar_url} alt="" className="object-cover" /> : null}
            <AvatarFallback>{nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-bold">{nickname}</span>
              {person.role === "owner" ? <Badge variant="secondary">Owner</Badge> : null}
            </span>
            {bio ? <span className="mt-1 line-clamp-1 block text-xs leading-5 text-muted-foreground">{bio}</span> : null}
            {arena ? <span className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-primary"><Gamepad2 size={12} aria-hidden="true" /><span className="truncate">MTG Arena · {arena}</span></span> : null}
          </span>
        </Link>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {error ? <p role="alert" className="px-3 pb-3 text-xs text-destructive">{error}</p> : null}
    </article>
  );
}
