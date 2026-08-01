/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { LockKeyhole, MapPin, UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlaygroupMembershipAction } from "@/lib/playgroups";
import type { PlaygroupDetail } from "@/services/playgroups";

const ACTION_LABELS = {
  join: "Join group",
  request: "Request to join",
  cancel: "Cancel request",
  leave: "Leave group",
} as const;

export default function PlaygroupHeader({
  group,
  busy,
  error,
  onMembershipAction,
}: {
  group: PlaygroupDetail;
  busy: boolean;
  error: string | null;
  onMembershipAction: () => void;
}) {
  const action = getPlaygroupMembershipAction(group);
  const location = [group.city?.trim(), group.country_code?.trim()].filter(Boolean).join(", ");
  const ownerName = group.owner.nickname.trim() || "Player";

  return (
    <header className="rounded-surface bg-surface/55 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-surface bg-secondary text-primary sm:h-24 sm:w-24">
          {group.avatar_url ? <img src={group.avatar_url} alt="" className="h-full w-full object-cover" /> : <UsersRound size={34} aria-hidden="true" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{group.name}</h1>
            {group.status === "archived" ? <Badge variant="secondary">Archived</Badge> : null}
            {group.membership_state === "owner" ? <Badge variant="secondary">Owner</Badge> : null}
            {group.membership_state === "joined" ? <Badge variant="secondary">Member</Badge> : null}
            {group.membership_state === "pending" ? <Badge variant="secondary">Request pending</Badge> : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {location ? <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{location}</span> : null}
            <span className="inline-flex items-center gap-1">
              {group.join_policy === "approval" ? <LockKeyhole size={13} aria-hidden="true" /> : null}
              {group.join_policy === "open" ? "Open membership" : "Owner approval required"}
            </span>
          </div>

          {group.description ? <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{group.description}</p> : null}

          <Link href={`/profile/${encodeURIComponent(group.owner.id)}`} className="mt-4 inline-flex items-center gap-2 rounded-control text-sm font-semibold text-muted-foreground outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/15">
            <Avatar className="h-7 w-7 bg-secondary">
              {group.owner.avatar_url ? <AvatarImage src={group.owner.avatar_url} alt="" className="object-cover" /> : null}
              <AvatarFallback className="text-xs">{ownerName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            Owned by {ownerName}
          </Link>
        </div>

        {action ? (
          <Button type="button" size="sm" variant={action === "cancel" || action === "leave" ? "outline" : "default"} onClick={onMembershipAction} disabled={busy} className="self-start">
            {busy ? "Working..." : ACTION_LABELS[action]}
          </Button>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-4 rounded-control bg-destructive-subtle px-3 py-2.5 text-sm text-destructive">{error}</p> : null}
    </header>
  );
}
