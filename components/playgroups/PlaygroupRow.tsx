/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, MapPin, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { type PlaygroupListItem } from "@/services/playgroups";

function membershipLabel(state: PlaygroupListItem["membership_state"]): string | null {
  if (state === "owner") return "Owner";
  if (state === "joined") return "Joined";
  if (state === "pending") return "Request pending";
  return null;
}

export default function PlaygroupRow({
  group,
  action,
  actionError,
}: {
  group: PlaygroupListItem;
  action?: ReactNode;
  actionError?: string | null;
}) {
  const name = group.name.trim() || "Playgroup";
  const description = group.description?.trim() || null;
  const location = [group.city?.trim(), group.country_code?.trim()].filter(Boolean).join(", ");
  const stateLabel = membershipLabel(group.membership_state);

  return (
    <article className="group min-w-0 rounded-row transition-colors hover:bg-secondary/45 focus-within:bg-secondary/45">
      <div className="flex min-h-[104px] items-center gap-2 px-3 py-3 sm:px-4">
        <Link
          href={`/playgroups/${encodeURIComponent(group.id)}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
          aria-label={`View ${name}`}
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-row bg-secondary text-primary">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <UsersRound size={24} aria-hidden="true" />
            )}
          </span>

          <span className="min-w-0 flex-1 py-0.5">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-bold text-foreground group-hover:text-secondary-foreground">{name}</span>
              {stateLabel ? <Badge variant="secondary">{stateLabel}</Badge> : null}
            </span>
            {description ? <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</span> : null}
            <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-quiet-foreground">
              {location ? <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />{location}</span> : null}
              <span className="inline-flex items-center gap-1">
                {group.join_policy === "approval" ? <LockKeyhole size={12} aria-hidden="true" /> : null}
                {group.join_policy === "open" ? "Open" : "Approval required"}
              </span>
            </span>
          </span>
        </Link>

        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
      {actionError ? <p role="alert" className="px-4 pb-3 text-xs text-destructive">{actionError}</p> : null}
    </article>
  );
}
