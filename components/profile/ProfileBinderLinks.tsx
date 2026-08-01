"use client";

import Link from "next/link";
import { Heart, Library } from "lucide-react";
import { useEffect, useState } from "react";

import { EMPTY_BINDER_FILTERS } from "@/components/binder/BinderFilters";
import { binderApi } from "@/services/binder";

export default function ProfileBinderLinks({ profileId, owner }: { profileId: string; owner: boolean }) {
  const [binderVisible, setBinderVisible] = useState(owner);
  const [wantedVisible, setWantedVisible] = useState(owner);

  useEffect(() => {
    if (owner) return;
    let active = true;
    void Promise.allSettled([
      binderApi.publicItems(profileId, EMPTY_BINDER_FILTERS, 1, 1),
      binderApi.publicWanted(profileId, 1, 1),
    ]).then(([binder, wanted]) => {
      if (!active) return;
      setBinderVisible(binder.status === "fulfilled");
      setWantedVisible(wanted.status === "fulfilled");
    });
    return () => { active = false; };
  }, [owner, profileId]);

  if (!binderVisible) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link href={owner ? "/binder?view=items" : `/profile/${encodeURIComponent(profileId)}/binder`} className="inline-flex h-9 items-center gap-1.5 rounded-control bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-primary/14"><Library size={15} aria-hidden="true" />Binder</Link>
      {wantedVisible ? <Link href={owner ? "/binder?view=wanted" : `/profile/${encodeURIComponent(profileId)}/binder#wanted-list`} className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-muted-foreground hover:bg-surface-subtle hover:text-primary"><Heart size={15} aria-hidden="true" />Wanted List</Link> : null}
    </div>
  );
}
