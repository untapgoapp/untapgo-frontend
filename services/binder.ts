import { ApiError, api } from "@/lib/api";
import {
  buildBinderItemsPath,
  buildCommunityBinderPath,
  buildInterestsPath,
  buildTradeThreadsPath,
  buildMatchesPath,
  buildWantedPath,
  binderItemSaveErrorFields,
  normalizeItemSubmission,
  normalizeWantedSubmission,
  type BinderFilters,
  type BinderInterest,
  type BinderItemFormErrors,
  type BinderItem,
  type BinderItemInput,
  type BinderMatch,
  type BinderTradeMessage,
  type BinderTradeMessagePage,
  type BinderTradeStatus,
  type BinderTradeThread,
  type CommunityBinderFilters,
  type CommunityBinderItem,
  type CommunityBinderResponse,
  type BinderSettings,
  type InterestType,
  type InterestView,
  type PageResponse,
  type PublicBinderResponse,
  type PublicWantedResponse,
  type WantedCard,
  type WantedCardInput,
} from "@/lib/binder";

export { ApiError };

export const binderApi = {
  settings: () => api.get<BinderSettings>("/binder/settings"),
  updateSettings: (payload: Partial<BinderSettings>) =>
    api.patch<BinderSettings>("/binder/settings", payload),
  items: (filters: BinderFilters, page: number) =>
    api.get<PageResponse<BinderItem>>(buildBinderItemsPath(filters, page)),
  community: (filters: CommunityBinderFilters, page: number) =>
    api.get<CommunityBinderResponse>(buildCommunityBinderPath(filters, page)),
  publicItems: (ownerId: string, filters: BinderFilters, page: number, pageSize = 24) =>
    api.get<PublicBinderResponse>(buildBinderItemsPath(filters, page, pageSize, ownerId)),
  publicItem: (id: string) =>
    api.get<CommunityBinderItem>(`/binder/items/${encodeURIComponent(id)}/public`),
  createItem: (input: BinderItemInput) =>
    api.post<BinderItem>("/binder/items", normalizeItemSubmission(input)),
  updateItem: (id: string, input: BinderItemInput) =>
    api.patch<BinderItem>(`/binder/items/${encodeURIComponent(id)}`, normalizeItemSubmission(input)),
  patchItem: (id: string, payload: Partial<BinderItemInput>) =>
    api.patch<BinderItem>(`/binder/items/${encodeURIComponent(id)}`, payload),
  withdrawItem: (id: string) =>
    api.delete<{ ok: boolean; status: "withdrawn" }>(`/binder/items/${encodeURIComponent(id)}`),
  removeItem: (id: string) =>
    api.delete<{ ok: boolean; removed: boolean; hard_deleted: boolean }>(`/binder/items/${encodeURIComponent(id)}/remove`),
  wanted: (page: number) => api.get<PageResponse<WantedCard>>(buildWantedPath(page)),
  publicWanted: (ownerId: string, page: number, pageSize = 24) =>
    api.get<PublicWantedResponse>(buildWantedPath(page, pageSize, ownerId)),
  createWanted: (input: WantedCardInput) =>
    api.post<WantedCard>("/binder/wanted", normalizeWantedSubmission(input)),
  updateWanted: (id: string, input: WantedCardInput) =>
    api.patch<WantedCard>(`/binder/wanted/${encodeURIComponent(id)}`, normalizeWantedSubmission(input)),
  patchWanted: (id: string, payload: Record<string, unknown>) =>
    api.patch<WantedCard>(`/binder/wanted/${encodeURIComponent(id)}`, payload),
  removeWanted: (id: string) =>
    api.delete<{ ok: boolean; status: "removed" }>(`/binder/wanted/${encodeURIComponent(id)}`),
  matches: (page: number) => api.get<PageResponse<BinderMatch>>(buildMatchesPath(page)),
  interests: (view: InterestView, page: number) =>
    api.get<PageResponse<BinderInterest>>(buildInterestsPath(view, page)),
  createInterest: (itemId: string, interestType: InterestType, message: string | null) =>
    api.post<BinderInterest>(`/binder/items/${encodeURIComponent(itemId)}/interest`, {
      interest_type: interestType,
      message: message?.trim() || null,
    }),
  acceptInterest: (id: string) =>
    api.post<BinderInterest>(`/binder/interests/${encodeURIComponent(id)}/accept`),
  declineInterest: (id: string) =>
    api.post<BinderInterest>(`/binder/interests/${encodeURIComponent(id)}/decline`),
  withdrawInterest: (id: string) =>
    api.delete<{ ok: boolean; status: "withdrawn" }>(`/binder/interests/${encodeURIComponent(id)}`),
  trades: (page: number, status: BinderTradeStatus | "" = "") =>
    api.get<PageResponse<BinderTradeThread>>(buildTradeThreadsPath(page, status)),
  trade: (id: string) =>
    api.get<BinderTradeThread>(`/binder/trades/${encodeURIComponent(id)}`),
  tradeMessages: (id: string, before?: string | null) => {
    const parameters = new URLSearchParams({ page_size: "50" });
    if (before) parameters.set("before", before);
    return api.get<BinderTradeMessagePage>(`/binder/trades/${encodeURIComponent(id)}/messages?${parameters}`);
  },
  sendTradeMessage: (id: string, body: string) =>
    api.post<BinderTradeMessage>(`/binder/trades/${encodeURIComponent(id)}/messages`, { body }),
  deleteTradeMessage: (id: string, messageId: string) =>
    api.delete<void>(`/binder/trades/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}`),
  markTradeRead: (id: string, messageId: string) =>
    api.post<{ last_read_message_id: string; last_read_at: string }>(`/binder/trades/${encodeURIComponent(id)}/read`, { last_read_message_id: messageId }),
  completeTrade: (id: string) =>
    api.post<{ id: string; status: BinderTradeStatus }>(`/binder/trades/${encodeURIComponent(id)}/complete`),
  cancelTrade: (id: string) =>
    api.post<{ id: string; status: BinderTradeStatus }>(`/binder/trades/${encodeURIComponent(id)}/cancel`),
};

export function binderErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const messages: Record<string, string> = {
    BINDER_ITEM_ALREADY_ACTIVE: "That exact card is already active in your Binder.",
    WANTED_CARD_ALREADY_ACTIVE: "That card is already on your active Wanted List.",
    PRINTING_FINISH_UNAVAILABLE: "That finish is not available for this exact printing.",
    PRINTING_LANGUAGE_MISMATCH: "Choose the language shown on the exact printing.",
    BINDER_ITEM_UNAVAILABLE: "This listing is no longer available.",
    BINDER_INTEREST_ALREADY_PENDING: "You already have a pending interest request for this card.",
    BINDER_INTEREST_NOT_PENDING: "This interest request is no longer pending.",
    INTEREST_TYPE_UNAVAILABLE: "Choose an interest type supported by this listing.",
    WANTED_EXACT_PRINTING_REQUIRED: "Choose an exact printing before requiring an exact match.",
    BINDER_NOT_FOUND: "This Binder is unavailable.",
    BINDER_ITEM_ACTIVE_TRADE: "Complete or cancel the active trade before removing this card.",
    BINDER_ITEM_HAS_HISTORY: "This card has trade history. Mark it unavailable instead of deleting it.",
    BINDER_TRADE_READ_ONLY: "This trade is closed and its chat is read-only.",
  };
  return (error.code && messages[error.code]) || fallback;
}

export function binderItemSaveErrors(error: unknown): BinderItemFormErrors {
  return binderItemSaveErrorFields(error instanceof ApiError ? error : null);
}
