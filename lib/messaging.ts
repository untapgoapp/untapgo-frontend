export const MESSAGING_REFRESH_REQUESTED_EVENT = "untapgo:messaging-refresh-requested";
export const ACTIVE_CONVERSATION_STORAGE_KEY = "untapgo:active-conversation";

export type ConversationKind = "direct" | "trade" | "playgroup";

export type ConversationSummary = {
  key: string;
  kind: ConversationKind;
  id: string;
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  href: string;
  unreadCount: number;
  updatedAt: string;
};

export type ActiveConversation = Pick<
  ConversationSummary,
  "kind" | "id" | "title" | "avatarUrl" | "href"
>;

export function conversationKey(kind: ConversationKind, id: string): string {
  return `${kind}:${id}`;
}

export function parseConversationTarget(value: string | null): ActiveConversation | null {
  if (!value) return null;
  const separator = value.indexOf(":");
  if (separator <= 0) return null;
  const kind = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if (!id || (kind !== "direct" && kind !== "trade" && kind !== "playgroup")) return null;
  return {
    kind,
    id,
    title: kind === "trade" ? "Trade" : kind === "playgroup" ? "Playgroup" : "Message",
    avatarUrl: null,
    href: kind === "direct"
      ? `/messages/${encodeURIComponent(id)}`
      : kind === "trade"
        ? `/trades/${encodeURIComponent(id)}`
        : `/playgroups/${encodeURIComponent(id)}?section=chat`,
  };
}
