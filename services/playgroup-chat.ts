import { api } from "@/lib/api";
import {
  PLAYGROUP_CHAT_PAGE_SIZE,
  type PlaygroupChatMessage,
  type PlaygroupChatMessagePage,
  type PlaygroupChatReadState,
  type PlaygroupChatState,
} from "@/lib/playgroup-communications";

function chatPath(playgroupId: string, suffix: string): string {
  return `/playgroups/${encodeURIComponent(playgroupId)}${suffix}`;
}

export function getPlaygroupChatMessages(
  playgroupId: string,
  before?: string | null,
): Promise<PlaygroupChatMessagePage> {
  const parameters = new URLSearchParams({ page_size: String(PLAYGROUP_CHAT_PAGE_SIZE) });
  if (before) parameters.set("before", before);
  return api.get<PlaygroupChatMessagePage>(`${chatPath(playgroupId, "/messages")}?${parameters}`);
}

export function sendPlaygroupChatMessage(
  playgroupId: string,
  body: string,
): Promise<PlaygroupChatMessage> {
  return api.post<PlaygroupChatMessage>(chatPath(playgroupId, "/messages"), { body });
}

export function deletePlaygroupChatMessage(playgroupId: string, messageId: string): Promise<void> {
  return api.delete<void>(chatPath(playgroupId, `/messages/${encodeURIComponent(messageId)}`));
}

export function getPlaygroupChatState(playgroupId: string): Promise<PlaygroupChatState> {
  return api.get<PlaygroupChatState>(chatPath(playgroupId, "/chat-state"));
}

export function markPlaygroupChatRead(
  playgroupId: string,
  lastReadMessageId: string,
): Promise<PlaygroupChatReadState> {
  return api.post<PlaygroupChatReadState>(chatPath(playgroupId, "/chat-read"), {
    last_read_message_id: lastReadMessageId,
  });
}
