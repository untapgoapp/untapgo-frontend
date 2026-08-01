"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

import PlaygroupChat from "@/components/playgroups/PlaygroupChat";
import PlaygroupCommunicationAccess from "@/components/playgroups/PlaygroupCommunicationAccess";
import PlaygroupHeader from "@/components/playgroups/PlaygroupHeader";
import PlaygroupMembers from "@/components/playgroups/PlaygroupMembers";
import PlaygroupOwnerTools from "@/components/playgroups/PlaygroupOwnerTools";
import PlaygroupRequests from "@/components/playgroups/PlaygroupRequests";
import PlaygroupSectionNav from "@/components/playgroups/PlaygroupSectionNav";
import PlaygroupWall from "@/components/playgroups/PlaygroupWall";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import {
  canAccessPlaygroupCommunications,
  getCommunicationContractChange,
  type PlaygroupSection,
} from "@/lib/playgroup-communications";
import {
  applyPlaygroupDetailResponse,
  applyPlaygroupMembershipResponse,
  getPlaygroupMembershipAction,
  shouldShowPlaygroupRequests,
} from "@/lib/playgroups";
import { getPlaygroupChatState } from "@/services/playgroup-chat";
import {
  getPlaygroup,
  joinPlaygroup,
  leavePlaygroup,
  type PlaygroupDetail as PlaygroupDetailType,
} from "@/services/playgroups";

export default function PlaygroupDetail({
  playgroupId,
  section,
  targetPostId,
}: {
  playgroupId: string;
  section: PlaygroupSection;
  targetPostId: string | null;
}) {
  const [group, setGroup] = useState<PlaygroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [memberRevision, setMemberRevision] = useState(0);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [chatStateLoaded, setChatStateLoaded] = useState(false);
  const [membershipViewerId, setMembershipViewerId] = useState<string | null>(null);
  const detailSequence = useRef(0);
  const unreadSequence = useRef(0);
  const { user, loading: authLoading } = useUser();
  const currentUserId = user?.id ?? null;
  const currentUserIdRef = useRef<string | null>(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const refreshGroup = useCallback(async (initial = false) => {
    const requestId = ++detailSequence.current;
    const requestViewerId = currentUserIdRef.current;
    if (initial) {
      setLoading(true);
      setLoadError(false);
    }
    try {
      const loaded = await getPlaygroup(playgroupId);
      if (detailSequence.current !== requestId) return;
      setGroup(loaded);
      setMembershipViewerId(requestViewerId);
      setLoading(false);
      if (initial) setLoadError(false);
    } catch {
      if (detailSequence.current === requestId && initial) setLoadError(true);
    } finally {
      if (detailSequence.current === requestId && initial) setLoading(false);
    }
  }, [playgroupId]);

  const handleContractError = useCallback((error: unknown) => {
    const change = getCommunicationContractChange(error);
    if (change === "access_lost") {
      unreadSequence.current += 1;
      setUnreadCount(null);
      setLastReadMessageId(null);
      setChatStateLoaded(false);
      setGroup((current) => current ? { ...current, membership_state: "none" } : current);
      void refreshGroup();
    } else if (change === "archived") {
      setGroup((current) => current ? { ...current, status: "archived" } : current);
      void refreshGroup();
    }
  }, [refreshGroup]);

  useEffect(() => {
    setGroup(null);
    setUnreadCount(null);
    setLastReadMessageId(null);
    setChatStateLoaded(false);
    setMembershipViewerId(null);
    setLoading(true);
    void refreshGroup(true);
    return () => {
      detailSequence.current += 1;
      unreadSequence.current += 1;
    };
  }, [playgroupId, refreshGroup]);

  useEffect(() => {
    setMembershipViewerId(null);
    setUnreadCount(null);
    setLastReadMessageId(null);
    setChatStateLoaded(false);
    if (!authLoading && currentUserId) void refreshGroup(true);
  }, [authLoading, currentUserId, refreshGroup]);

  const authenticated = !authLoading && Boolean(user);
  const hasCommunicationAccess = group
    ? membershipViewerId === currentUserId
      && canAccessPlaygroupCommunications(group.membership_state, authenticated)
    : false;

  const refreshUnread = useCallback(async () => {
    if (!hasCommunicationAccess) return;
    const requestId = ++unreadSequence.current;
    try {
      const state = await getPlaygroupChatState(playgroupId);
      if (unreadSequence.current === requestId) {
        setUnreadCount(state.unread_count);
        setLastReadMessageId(state.last_read_message_id ?? null);
        setChatStateLoaded(true);
      }
    } catch (error) {
      if (unreadSequence.current === requestId) handleContractError(error);
    }
  }, [handleContractError, hasCommunicationAccess, playgroupId]);

  const revalidateMembership = useCallback(() => {
    void refreshGroup();
  }, [refreshGroup]);

  const requestUnreadRefresh = useCallback(() => {
    void refreshUnread();
  }, [refreshUnread]);

  const handleMarkedRead = useCallback((messageId: string) => {
    setUnreadCount(0);
    setLastReadMessageId(messageId);
  }, []);

  useEffect(() => {
    if (!hasCommunicationAccess) {
      unreadSequence.current += 1;
      setUnreadCount(null);
      setLastReadMessageId(null);
      setChatStateLoaded(false);
      return;
    }
    void refreshUnread();
    const interval = window.setInterval(() => void refreshUnread(), 30_000);
    return () => window.clearInterval(interval);
  }, [hasCommunicationAccess, refreshUnread]);

  useEffect(() => {
    if (!hasCommunicationAccess) return;
    const revalidate = () => {
      if (document.visibilityState === "visible") {
        void refreshGroup();
        void refreshUnread();
      }
    };
    const interval = window.setInterval(() => void refreshGroup(), 30_000);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [hasCommunicationAccess, refreshGroup, refreshUnread]);

  async function changeMembership() {
    if (!group || actionBusy) return;
    const action = getPlaygroupMembershipAction(group);
    if (!action) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const result = action === "join" || action === "request"
        ? await joinPlaygroup(group.id)
        : await leavePlaygroup(group.id);
      setGroup((current) => current ? applyPlaygroupMembershipResponse(current, result) : current);
      setMembershipViewerId(currentUserId);
      if (result.membership_state === "joined" || action === "leave") setMemberRevision((value) => value + 1);
    } catch {
      setActionError("That membership action could not be completed. Please try again.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading && !group) return <PlaygroupDetailLoading />;
  if (loadError || !group) return <PlaygroupDetailError onRetry={() => void refreshGroup(true)} />;

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1050px]">
        <Link href="/playgroups" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={15} aria-hidden="true" /> Back to Playgroups</Link>
        <PlaygroupHeader group={group} busy={actionBusy} error={actionError} onMembershipAction={() => void changeMembership()} />
        <PlaygroupSectionNav playgroupId={group.id} active={section} unreadCount={hasCommunicationAccess ? unreadCount : null} />

        {section === "overview" ? (
          <>
            {shouldShowPlaygroupRequests(group) ? <div className="mt-6"><PlaygroupRequests playgroupId={group.id} onApproved={() => setMemberRevision((value) => value + 1)} /></div> : null}
            {group.membership_state === "owner" ? <PlaygroupOwnerTools group={group} onUpdated={(updated) => setGroup((current) => current ? applyPlaygroupDetailResponse(current, updated) : updated)} /> : null}
          </>
        ) : null}
        {section === "members" ? <PlaygroupMembers playgroupId={group.id} refreshKey={memberRevision} /> : null}
        {section === "wall" && !hasCommunicationAccess ? <PlaygroupCommunicationAccess membershipState={group.membership_state} authLoading={authLoading} /> : null}
        {section === "chat" && !hasCommunicationAccess ? <PlaygroupCommunicationAccess membershipState={group.membership_state} authLoading={authLoading} /> : null}
        {section === "wall" && hasCommunicationAccess ? <PlaygroupWall playgroupId={group.id} viewerId={user?.id ?? null} membershipState={group.membership_state} archived={group.status === "archived"} targetPostId={targetPostId} onContractError={handleContractError} /> : null}
        {section === "chat" && hasCommunicationAccess && user ? <PlaygroupChat playgroupId={group.id} viewerId={user.id} membershipState={group.membership_state} archived={group.status === "archived"} chatStateLoaded={chatStateLoaded} lastReadMessageId={lastReadMessageId} onContractError={handleContractError} onMembershipCheck={revalidateMembership} onMarkedRead={handleMarkedRead} onRefreshUnread={requestUnreadRefresh} /> : null}
      </div>
    </main>
  );
}

function PlaygroupDetailLoading() {
  return <main className="min-h-screen px-4 py-6 sm:px-5 sm:py-8 lg:px-0"><div className="w-full max-w-[1050px] animate-pulse rounded-surface bg-surface/45 p-5"><div className="h-24 w-24 rounded-surface bg-secondary" /><div className="mt-4 h-7 w-2/5 rounded bg-black/10" /><div className="mt-3 h-4 w-3/4 rounded bg-black/[0.06]" /></div></main>;
}

function PlaygroupDetailError({ onRetry }: { onRetry: () => void }) {
  return <main className="min-h-screen px-4 py-8 text-foreground lg:px-0"><div role="alert" className="w-full max-w-[1050px] rounded-surface bg-destructive-subtle px-4 py-5"><h1 className="text-lg font-bold text-destructive">This playgroup could not be loaded.</h1><p className="mt-1 text-sm text-destructive/85">It may be unavailable, or the service may need a moment.</p><Button type="button" size="sm" onClick={onRetry} className="mt-4">Retry</Button></div></main>;
}
