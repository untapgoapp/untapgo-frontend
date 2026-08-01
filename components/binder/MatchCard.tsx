import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { reasonLabel, type BinderMatch } from "@/lib/binder";

import BinderCard from "./BinderCard";

export default function MatchCard({ match, busy, error, onInterest }: {
  match: BinderMatch;
  busy: boolean;
  error?: string | null;
  onInterest: () => void;
}) {
  const ownerHref = `/profile/${encodeURIComponent(match.owner.id)}`;
  const binderHref = `${ownerHref}/binder`;
  return (
    <div className="min-w-0">
      <Link href={ownerHref} className="mb-3 flex items-center gap-2 rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
        <Avatar className="h-8 w-8"><AvatarImage src={match.owner.avatar_url ?? undefined} alt="" /><AvatarFallback>{match.owner.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
        <span className="truncate text-sm font-semibold">{match.owner.nickname}</span>
      </Link>
      <BinderCard item={match.binder_item} href={binderHref} busy={busy} error={error} onInterest={onInterest} />
      {busy ? <p className="mt-2 text-xs font-semibold text-success">Interest sent.</p> : null}
      <div className="mt-2 flex flex-wrap gap-1">{match.match_reasons.map((reason) => <Badge key={reason} variant="secondary">{reasonLabel(reason)}</Badge>)}</div>
    </div>
  );
}
