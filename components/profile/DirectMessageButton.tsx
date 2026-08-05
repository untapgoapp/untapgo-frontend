"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getProfileRelationship,
  PROFILE_RELATIONSHIP_CHANGED_EVENT,
} from "@/services/profiles";
import { directMessagesApi } from "@/services/direct-messages";

export default function DirectMessageButton({
  profileId,
  blocked,
}: {
  profileId: string;
  blocked: boolean;
}) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      setLoading(true);
      setError(null);
      if (blocked) {
        setConnected(false);
        setLoading(false);
        return;
      }
      try {
        const relationship = await getProfileRelationship(profileId);
        if (active) setConnected(relationship.is_mutual === true);
      } catch {
        if (active) setConnected(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    function onRelationshipChanged(event: Event) {
      const detail = (event as CustomEvent<{ profileId?: string }>).detail;
      if (!detail?.profileId || detail.profileId === profileId) void refresh();
    }

    void refresh();
    window.addEventListener(PROFILE_RELATIONSHIP_CHANGED_EVENT, onRelationshipChanged);
    return () => {
      active = false;
      window.removeEventListener(PROFILE_RELATIONSHIP_CHANGED_EVENT, onRelationshipChanged);
    };
  }, [blocked, profileId]);

  if (loading || blocked || !connected) return null;

  async function openConversation() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const conversation = await directMessagesApi.start(profileId);
      router.push(`/messages/${encodeURIComponent(conversation.id)}`);
    } catch {
      setError("Message could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => void openConversation()}
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        {busy ? "Opening…" : "Message"}
      </Button>
      {error ? <span role="alert" className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
