"use client";

import { supabase } from "@/lib/supabase/client";

import type {
  ArtworkOptionsResponse,
  CardAutocompleteResponse,
  CardSearchResponse,
  CardSymbologyResponse,
  CoverCardOptionsResponse,
  Deck,
  DeckCardsResponse,
  DeckImportPreview,
  DeckImportResponse,
  DeckListResponse,
  ScryfallCard,
} from "@/types/decks";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  ""
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  detail?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

function extractError(
  payload: unknown,
): {
  code?: string;
  message: string;
} {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return {
      message: "Something went wrong",
    };
  }

  const record =
    payload as Record<
      string,
      unknown
    >;

  const detail =
    record.detail;

  if (
    typeof detail === "string"
  ) {
    return {
      message: detail,
    };
  }

  if (
    detail &&
    typeof detail === "object"
  ) {
    const value =
      detail as Record<
        string,
        unknown
      >;

    const code =
      typeof value.code === "string"
        ? value.code
        : undefined;

    return {
      code,
      message:
        typeof value.message ===
        "string"
          ? value.message
          : code
            ? code
                .replaceAll(
                  "_",
                  " ",
                )
                .toLowerCase()
            : "Something went wrong",
    };
  }

  return {
    message:
      "Something went wrong",
  };
}

async function getAccessToken(): Promise<string> {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const token =
    data.session?.access_token;

  if (!token) {
    throw new ApiError(
      "You need to sign in again",
      401,
      "AUTH_REQUIRED",
    );
  }

  return token;
}

async function readResponsePayload(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  return response.text();
}

async function sendRequest(
  path: string,
  init: RequestInit,
  token: string,
): Promise<{
  response: Response;
  payload: unknown;
}> {
  const headers =
    new Headers(
      init.headers,
    );

  headers.set(
    "Authorization",
    `Bearer ${token}`,
  );

  headers.set(
    "Accept",
    "application/json",
  );

  if (
    init.body &&
    !headers.has(
      "Content-Type",
    )
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...init,
        headers,
        cache: "no-store",
      },
    );

  return {
    response,
    payload:
      await readResponsePayload(
        response,
      ),
  };
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "Missing NEXT_PUBLIC_BACKEND_URL (or NEXT_PUBLIC_API_BASE_URL)",
    );
  }

  let token =
    await getAccessToken();

  let result =
    await sendRequest(
      path,
      init,
      token,
    );

  if (
    result.response.status ===
    401
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.refreshSession();

    if (
      !error &&
      data.session?.access_token
    ) {
      token =
        data.session.access_token;

      result =
        await sendRequest(
          path,
          init,
          token,
        );
    }
  }

  if (
    !result.response.ok
  ) {
    const extracted =
      extractError(
        result.payload,
      );

    throw new ApiError(
      extracted.message,
      result.response.status,
      extracted.code,
      result.payload,
    );
  }

  return result.payload as T;
}

export const decksApi = {
  list: () =>
    apiFetch<DeckListResponse>(
      "/me/decks",
    ),

  get: (deckId: string) =>
    apiFetch<Deck>(
      `/me/decks/${deckId}`,
    ),

  create(payload: {
    name: string;
    format_slug?: string | null;
    deck_url?: string | null;
    is_public: boolean;
  }) {
    return apiFetch<Deck>(
      "/me/decks",
      {
        method: "POST",
        body:
          JSON.stringify(
            payload,
          ),
      },
    );
  },

  update(
    deckId: string,
    payload: {
      name?: string;
      commander_name?: string | null;
      format_slug?: string | null;
      deck_url?: string | null;
      is_public?: boolean;
      export_text?: string | null;
    },
  ) {
    return apiFetch<Deck>(
      `/me/decks/${deckId}`,
      {
        method: "PATCH",
        body:
          JSON.stringify(
            payload,
          ),
      },
    );
  },

  remove(
    deckId: string,
  ) {
    return apiFetch<{
      ok: boolean;
    }>(
      `/me/decks/${deckId}`,
      {
        method: "DELETE",
      },
    );
  },

  parse(
    text: string,
  ) {
    return apiFetch<DeckImportPreview>(
      "/me/decks/parse",
      {
        method: "POST",
        body:
          JSON.stringify({
            text,
            resolve: true,
          }),
      },
    );
  },

  importText(
    deckId: string,
    text: string,
  ) {
    return apiFetch<DeckImportResponse>(
      `/me/decks/${deckId}/import`,
      {
        method: "PUT",
        body:
          JSON.stringify({
            text,
            replace_existing:
              true,
          }),
      },
    );
  },

  cards: (
    deckId: string,
  ) =>
    apiFetch<DeckCardsResponse>(
      `/me/decks/${deckId}/cards`,
    ),

  coverCards: (
    deckId: string,
  ) =>
    apiFetch<CoverCardOptionsResponse>(
      `/me/decks/${deckId}/cover-cards`,
    ),

  coverArtworks: (
    deckId: string,
    oracleId: string,
  ) =>
    apiFetch<ArtworkOptionsResponse>(
      `/me/decks/${deckId}/cover-artworks/${oracleId}`,
    ),

  updateCover(
    deckId: string,
    payload: {
      scryfall_id:
        | string
        | null;
      focus_x: number;
      focus_y: number;
    },
  ) {
    return apiFetch<Deck>(
      `/me/decks/${deckId}/cover`,
      {
        method: "PATCH",
        body:
          JSON.stringify(
            payload,
          ),
      },
    );
  },

  symbology() {
    return apiFetch<CardSymbologyResponse>(
      "/cards/symbology",
    );
  },

  autocompleteCards(
    query: string,
  ) {
    return apiFetch<CardAutocompleteResponse>(
      `/cards/autocomplete?q=${encodeURIComponent(
        query,
      )}`,
    );
  },

  namedCard(
    name: string,
    fuzzy = false,
  ) {
    return apiFetch<ScryfallCard>(
      `/cards/named?name=${encodeURIComponent(
        name,
      )}&fuzzy=${
        fuzzy
          ? "true"
          : "false"
      }`,
    );
  },

  cardById(
    scryfallId: string,
  ) {
    return apiFetch<ScryfallCard>(
      `/cards/${encodeURIComponent(
        scryfallId,
      )}`,
    );
  },

  searchCards(
    query: string,
    unique:
      | "cards"
      | "art"
      | "prints" =
      "cards",
  ) {
    return apiFetch<CardSearchResponse>(
      `/cards/search?q=${encodeURIComponent(
        query,
      )}&unique=${unique}`,
    );
  },
};

export function getCardImage(
  card:
    | {
        image_uris?: {
          small?:
            | string
            | null;
          normal?:
            | string
            | null;
          large?:
            | string
            | null;
          png?:
            | string
            | null;
          art_crop?:
            | string
            | null;
          border_crop?:
            | string
            | null;
        } | null;
        card_faces?: Array<{
          image_uris?: {
            small?:
              | string
              | null;
            normal?:
              | string
              | null;
            large?:
              | string
              | null;
            png?:
              | string
              | null;
            art_crop?:
              | string
              | null;
            border_crop?:
              | string
              | null;
          } | null;
        }>;
      }
    | null
    | undefined,
  size:
    | "small"
    | "normal"
    | "large"
    | "png"
    | "art_crop"
    | "border_crop" =
    "normal",
): string | null {
  return (
    card?.image_uris?.[
      size
    ] ??
    card
      ?.card_faces?.[0]
      ?.image_uris?.[
        size
      ] ??
    null
  );
}
