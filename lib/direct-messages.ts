export type DirectMessageUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export type DirectConversationLastMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type DirectConversation = {
  id: string;
  other_user: DirectMessageUser;
  created_at: string;
  updated_at: string;
  last_message: DirectConversationLastMessage | null;
  unread_count: number;
  can_message: boolean;
};

export type DirectConversationPage = {
  items: DirectConversation[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type DirectMessage = {
  id: string;
  conversation_id: string;
  sender: DirectMessageUser;
  body: string;
  created_at: string;
};

export type DirectMessagePage = {
  items: DirectMessage[];
  has_more: boolean;
  next_before: string | null;
};

export function mergeDirectMessages(
  current: DirectMessage[],
  incoming: DirectMessage[],
): DirectMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => {
    const byDate = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    return byDate || left.id.localeCompare(right.id);
  });
}

export function isDirectMessage(value: unknown, conversationId: string): value is DirectMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DirectMessage>;
  return Boolean(
    typeof candidate.id === "string" &&
    candidate.conversation_id === conversationId &&
    typeof candidate.body === "string" &&
    typeof candidate.created_at === "string" &&
    candidate.sender &&
    typeof candidate.sender.id === "string" &&
    typeof candidate.sender.nickname === "string"
  );
}
