import { LockKeyhole } from "lucide-react";

import type { CommunicationMembershipState } from "@/lib/playgroup-communications";

export default function PlaygroupCommunicationAccess({
  membershipState,
  authLoading,
}: {
  membershipState: CommunicationMembershipState;
  authLoading: boolean;
}) {
  const message = authLoading
    ? "Checking your Playgroup access…"
    : membershipState === "pending"
      ? "Wall and Chat become available after the owner approves your request."
      : "Join this Playgroup to read and take part in Wall and Chat.";

  return (
    <section className="py-8" aria-live="polite">
      <div className="flex max-w-xl items-start gap-3 rounded-surface bg-surface-subtle/75 px-4 py-4 text-sm text-muted-foreground">
        <LockKeyhole size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </section>
  );
}
