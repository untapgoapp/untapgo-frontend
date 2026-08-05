import { api } from "@/lib/api";
import type {
  DirectConversation,
  DirectConversationPage,
  DirectMessage,
  DirectMessagePage,
} from "@/lib/direct-messages";

export const directMessagesApi = {
  start(userId: string): Promise<DirectConversation> {
    return api.post<DirectConversation>(`/messages/direct/${encodeURIComponent(userId)}`);
  },

  conversations(page = 1, pageSize = 20): Promise<DirectConversationPage> {
    return api.get<DirectConversationPage>(
      `/messages/conversations?page=${page}&page_size=${pageSize}`,
    );
  },

  conversation(conversationId: string): Promise<DirectConversation> {
    return api.get<DirectConversation>(
      `/messages/conversations/${encodeURIComponent(conversationId)}`,
    );
  },

  messages(
    conversationId: string,
    before?: string | null,
    pageSize = 50,
  ): Promise<DirectMessagePage> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (before) params.set("before", before);
    return api.get<DirectMessagePage>(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
    );
  },

  send(conversationId: string, body: string): Promise<DirectMessage> {
    return api.post<DirectMessage>(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
      { body },
    );
  },

  remove(conversationId: string, messageId: string): Promise<unknown> {
    return api.delete(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
    );
  },

  markRead(conversationId: string, lastReadMessageId: string): Promise<unknown> {
    return api.post(
      `/messages/conversations/${encodeURIComponent(conversationId)}/read`,
      { last_read_message_id: lastReadMessageId },
    );
  },
};
