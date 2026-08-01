export type BinderVisibility = "public" | "private";
export type BinderAvailability = "trade" | "sell" | "both";
export type BinderStatus = "active" | "reserved" | "completed" | "withdrawn";
export type CardCondition = "nm" | "lp" | "mp" | "hp" | "damaged";
export type CardFinish = "nonfoil" | "foil" | "etched";
export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";
export type WantedStatus = "active" | "fulfilled" | "removed";
export type InterestType = "trade" | "buy" | "either";
export type InterestStatus = "pending" | "accepted" | "declined" | "withdrawn";
export type InterestView = "received" | "sent";
export type BinderView = "items" | "wanted" | "matches" | InterestView;

export type BinderSettings = {
  visibility: BinderVisibility;
  show_wanted_list: boolean;
};

export type BinderUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export type BinderItem = {
  id: string;
  scryfall_card_id: string;
  oracle_id: string | null;
  card_name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  image_url: string | null;
  language: string;
  finish: CardFinish;
  condition: CardCondition;
  quantity: number;
  availability: BinderAvailability;
  asking_price: string | number | null;
  currency: Currency | null;
  notes: string | null;
  status: BinderStatus;
  created_at: string;
  updated_at: string;
};

export type WantedCard = {
  id: string;
  oracle_id: string;
  preferred_scryfall_card_id: string | null;
  card_name: string;
  preferred_set_code: string | null;
  preferred_collector_number: string | null;
  image_url: string | null;
  quantity: number;
  minimum_condition: CardCondition | null;
  preferred_language: string | null;
  preferred_finish: CardFinish | null;
  notes: string | null;
  status: WantedStatus;
  created_at: string;
  updated_at: string;
};

export type BinderMatch = {
  binder_item: BinderItem;
  owner: BinderUser;
  wanted_card_id: string;
  match_reasons: string[];
};

export type BinderInterest = {
  id: string;
  binder_item: BinderItem;
  other_user: BinderUser;
  interest_type: InterestType;
  message: string | null;
  status: InterestStatus;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PublicBinderResponse = PageResponse<BinderItem> & { owner: BinderUser };
export type PublicWantedResponse = PageResponse<WantedCard> & { owner: BinderUser };

export type BinderFilters = {
  q: string;
  availability: "" | BinderAvailability;
  condition: "" | CardCondition;
  finish: "" | CardFinish;
  set_code: string;
  status?: "" | BinderStatus;
};

export type BinderItemInput = {
  scryfall_card_id?: string;
  language: string;
  finish: CardFinish;
  condition: CardCondition;
  quantity: number;
  availability: BinderAvailability;
  asking_price: number | null;
  currency: Currency | null;
  notes: string | null;
  status?: BinderStatus;
};

export type BinderItemFormErrors = {
  card?: string;
  finish?: string;
  price?: string;
  quantity?: string;
  availability?: string;
  form?: string;
};

export type WantedCardInput = {
  scryfall_card_id?: string;
  match_any_printing: boolean;
  quantity: number;
  minimum_condition: CardCondition | null;
  preferred_language: string | null;
  preferred_finish: CardFinish | null;
  notes: string | null;
};

export const BINDER_VIEWS: readonly BinderView[] = [
  "items", "wanted", "matches", "received", "sent",
];

export const CONDITION_LABELS: Record<CardCondition, string> = {
  nm: "Near Mint",
  lp: "Lightly Played",
  mp: "Moderately Played",
  hp: "Heavily Played",
  damaged: "Damaged",
};

export const FINISH_LABELS: Record<CardFinish, string> = {
  nonfoil: "Nonfoil",
  foil: "Foil",
  etched: "Etched",
};

export const AVAILABILITY_LABELS: Record<BinderAvailability, string> = {
  trade: "Trade",
  sell: "Sell",
  both: "Trade or sell",
};

export const INTEREST_LABELS: Record<InterestType, string> = {
  trade: "Trade",
  buy: "Buy",
  either: "Either",
};

export function normalizeBinderView(value: string | null | undefined): BinderView {
  return BINDER_VIEWS.includes(value as BinderView) ? value as BinderView : "items";
}

function addPage(parameters: URLSearchParams, page: number, pageSize: number) {
  parameters.set("page", String(page));
  parameters.set("page_size", String(pageSize));
}

export function buildBinderItemsPath(
  filters: BinderFilters,
  page: number,
  pageSize = 24,
  ownerId?: string,
): string {
  const parameters = new URLSearchParams();
  const query = filters.q.trim();
  const setCode = filters.set_code.trim().toLowerCase();
  if (query) parameters.set("q", query);
  if (filters.availability) parameters.set("availability", filters.availability);
  if (filters.condition) parameters.set("condition", filters.condition);
  if (filters.finish) parameters.set("finish", filters.finish);
  if (setCode) parameters.set("set_code", setCode);
  if (!ownerId && filters.status) parameters.set("status", filters.status);
  addPage(parameters, page, pageSize);
  const root = ownerId
    ? `/profiles/${encodeURIComponent(ownerId)}/binder`
    : "/binder/items";
  return `${root}?${parameters.toString()}`;
}

export function buildWantedPath(page: number, pageSize = 24, ownerId?: string): string {
  const parameters = new URLSearchParams();
  addPage(parameters, page, pageSize);
  const root = ownerId
    ? `/profiles/${encodeURIComponent(ownerId)}/wanted`
    : "/binder/wanted";
  return `${root}?${parameters.toString()}`;
}

export function buildMatchesPath(page: number, pageSize = 24): string {
  return `/binder/matches?page=${page}&page_size=${pageSize}`;
}

export function buildInterestsPath(view: InterestView, page: number, pageSize = 20): string {
  return `/binder/interests?view=${view}&page=${page}&page_size=${pageSize}`;
}

export function itemIdentity(value: BinderItem | BinderMatch): string {
  return "binder_item" in value
    ? `${value.wanted_card_id}:${value.binder_item.id}`
    : value.id;
}

export function mergeUnique<T>(current: T[], incoming: T[], identity: (item: T) => string): T[] {
  const result = new Map<string, T>();
  for (const item of [...current, ...incoming]) result.set(identity(item), item);
  return [...result.values()];
}

export function allowedInterestTypes(availability: BinderAvailability): InterestType[] {
  if (availability === "trade") return ["trade"];
  if (availability === "sell") return ["buy"];
  return ["trade", "buy", "either"];
}

export function formatAskingPrice(item: BinderItem): string | null {
  if (item.asking_price === null || !item.currency) return null;
  const amount = Number(item.asking_price);
  if (!Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: item.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${item.currency} ${amount.toFixed(2)}`;
  }
}

export function parseOptionalAskingPrice(
  value: string,
  currency: Currency,
):
  | { ok: true; asking_price: number | null; currency: Currency | null }
  | { ok: false; message: string } {
  const normalized = value.trim();
  if (!normalized) return { ok: true, asking_price: null, currency: null };
  const askingPrice = Number(normalized);
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
    return { ok: false, message: "Asking price must be greater than zero." };
  }
  return {
    ok: true,
    asking_price: Number(askingPrice.toFixed(2)),
    currency,
  };
}

export function formatAskingPriceInput(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const askingPrice = Number(normalized);
  return Number.isFinite(askingPrice) && askingPrice > 0
    ? askingPrice.toFixed(2)
    : value;
}

export function shouldSearchCardQuery({
  query,
  hasSelectedCard,
  isSearchOpen,
  loadingPrintings,
}: {
  query: string;
  hasSelectedCard: boolean;
  isSearchOpen: boolean;
  loadingPrintings: boolean;
}): boolean {
  return isSearchOpen
    && !hasSelectedCard
    && !loadingPrintings
    && query.trim().length >= 2;
}

function validationField(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (!Array.isArray(detail)) return null;
  for (const issue of detail) {
    if (!issue || typeof issue !== "object") continue;
    const location = (issue as { loc?: unknown }).loc;
    if (!Array.isArray(location)) continue;
    const field = location.at(-1);
    if (typeof field === "string") return field;
  }
  return null;
}

export function binderItemSaveErrorFields(error: {
  status: number;
  code?: string;
  body?: unknown;
} | null): BinderItemFormErrors {
  const fallback = "This card could not be saved. Please try again.";
  if (!error) return { form: fallback };

  if (["BINDER_ITEM_ALREADY_ACTIVE", "BINDER_DUPLICATE", "RESOURCE_ALREADY_EXISTS"].includes(error.code ?? "")) {
    return { card: "That exact card is already active in your Binder." };
  }
  if (error.code === "PRINTING_FINISH_UNAVAILABLE") {
    return { finish: "That finish is not available for this exact printing." };
  }
  if (error.code === "PRINTING_LANGUAGE_MISMATCH") {
    return { card: "Choose the language shown on the exact printing." };
  }
  if (error.code === "SCRYFALL_CARD_INCOMPLETE" || error.code === "SCRYFALL_FINISHES_UNAVAILABLE") {
    return { card: "That exact printing could not be verified. Choose it again." };
  }
  if (error.code === "DATABASE_REQUEST_FAILED" || error.code === "BINDER_UPSTREAM_UNAVAILABLE") {
    return { form: "Binder storage is temporarily unavailable. Please try again later." };
  }

  if (error.status === 422) {
    const field = validationField(error.body);
    if (field === "asking_price" || field === "currency") {
      return { price: "Enter a price greater than zero, or leave the price empty." };
    }
    if (field === "scryfall_card_id" || field === "language") {
      return { card: "Select an exact card printing." };
    }
    if (field === "finish") return { finish: "Choose a supported finish." };
    if (field === "quantity") return { quantity: "Quantity must be between 1 and 999." };
    if (field === "availability") return { availability: "Choose how this card is available." };
  }

  if (error.status === 409) {
    return { card: "That listing conflicts with an active card already in your Binder." };
  }
  return { form: fallback };
}

export function normalizeItemSubmission(input: BinderItemInput) {
  const payload: Record<string, unknown> = {
    ...input,
    language: input.language.trim().toLowerCase(),
    quantity: Math.max(1, Math.min(999, Math.trunc(input.quantity))),
    notes: input.notes?.trim() || null,
  };
  if (input.asking_price === null) {
    payload.asking_price = null;
    payload.currency = null;
  } else {
    if (!Number.isFinite(input.asking_price) || input.asking_price <= 0 || !input.currency) {
      throw new RangeError("A positive asking price and currency are required together");
    }
    payload.asking_price = Number(input.asking_price.toFixed(2));
  }
  if (!input.scryfall_card_id) delete payload.scryfall_card_id;
  if (!input.status) delete payload.status;
  return payload;
}

export function normalizeWantedSubmission(input: WantedCardInput) {
  const payload: Record<string, unknown> = {
    ...input,
    quantity: Math.max(1, Math.min(999, Math.trunc(input.quantity))),
    preferred_language: input.preferred_language?.trim().toLowerCase() || null,
    notes: input.notes?.trim() || null,
  };
  if (!input.scryfall_card_id) delete payload.scryfall_card_id;
  return payload;
}

export function reasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    oracle_id: "Card match",
    exact_printing: "Exact printing",
    minimum_condition: "Condition preference",
    language: "Language preference",
    finish: "Finish preference",
  };
  return labels[reason] ?? reason.replaceAll("_", " ");
}
