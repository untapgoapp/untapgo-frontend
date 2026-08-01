"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  normalizeCommunicationBody,
  PLAYGROUP_CHAT_MAX_LENGTH,
  shouldShowRemainingCharacters,
  shouldSubmitChatKey,
} from "@/lib/playgroup-communications";

export default function PlaygroupChatComposer({
  onSend,
}: {
  onSend: (body: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const sendingRef = useRef(false);
  const body = normalizeCommunicationBody(value, PLAYGROUP_CHAT_MAX_LENGTH);
  const remaining = PLAYGROUP_CHAT_MAX_LENGTH - value.length;

  async function submit() {
    if (!body || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(false);
    try {
      await onSend(body);
      setValue("");
    } catch {
      setError(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="border-t border-border/60 bg-background px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-3 lg:pb-3">
      <div className="flex min-w-0 items-end gap-2">
        <label htmlFor="playgroup-chat-message" className="sr-only">Message the Playgroup</label>
        <textarea
          id="playgroup-chat-message"
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(false); }}
          onKeyDown={(event) => {
            if (shouldSubmitChatKey(event.key, event.shiftKey, event.nativeEvent.isComposing)) {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={PLAYGROUP_CHAT_MAX_LENGTH}
          rows={1}
          enterKeyHint="send"
          placeholder="Message the Playgroup"
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-control border border-border-strong bg-surface px-3 py-2.5 text-base leading-6 outline-none placeholder:text-quiet-foreground focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15 sm:text-sm"
        />
        <Button type="submit" size="icon-lg" aria-label="Send message" disabled={!body || sending}><Send aria-hidden="true" /></Button>
      </div>
      <div className="mt-1.5 min-h-4 text-xs text-muted-foreground" aria-live="polite">
        {sending ? "Sending…" : null}
        {!sending && error ? <span role="alert" className="text-destructive">Your message was not sent. Try again.</span> : null}
        {!sending && !error && shouldShowRemainingCharacters(value.length, PLAYGROUP_CHAT_MAX_LENGTH) ? `${remaining} characters left` : null}
      </div>
    </form>
  );
}
