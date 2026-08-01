import { ApiError, api } from "@/lib/api";
import {
  buildBinderItemsPath,
  buildCommunityBinderPath,
  buildInterestsPath,
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
  type CommunityBinderFilters,
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
  createItem: (input: BinderItemInput) =>
    api.post<BinderItem>("/binder/items", normalizeItemSubmission(input)),
  updateItem: (id: string, input: BinderItemInput) =>
    api.patch<BinderItem>(`/binder/items/${encodeURIComponent(id)}`, normalizeItemSubmission(input)),
  patchItem: (id: string, payload: Partial<BinderItemInput>) =>
    api.patch<BinderItem>(`/binder/items/${encodeURIComponent(id)}`, payload),
  withdrawItem: (id: string) =>
    api.delete<{ ok: boolean; status: "withdrawn" }>(`/binder/items/${encodeURIComponent(id)}`),
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
  };
  return (error.code && messages[error.code]) || fallback;
}

export function binderItemSaveErrors(error: unknown): BinderItemFormErrors {
  return binderItemSaveErrorFields(error instanceof ApiError ? error : null);
}
