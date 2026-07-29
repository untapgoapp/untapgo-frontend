const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export type EventItem = {
  id: string;
  title: string;
  description?: string | null;

  address_text?: string | null;
  place_id?: string | null;
  lat?: number | null;
  lng?: number | null;

  status: string;
  starts_at?: string | null;
  duration_minutes?: number | null;

  attendees_count: number;
  max_players: number;

  host_user_id?: string;
  host_nickname?: string | null;

  is_joined?: boolean;
  my_status?: string | null;
  my_is_playing?: boolean | null;

  format_slug?: string | null;
  format?: string | null;

  proxies_policy?: string | null;
  power_level?: string | null;
  host_notes?: string | null;

  distance_km?: number | null;
  cooldown_seconds?: number | null;
  pending_requests_count?: number | null;

  attendance_method?: "none" | "host" | "qr";
  allow_walk_ins?: boolean;
  attendance_finalized_at?: string | null;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: unknown;

  constructor({
    status,
    message,
    code,
    body,
  }: {
    status: number;
    message: string;
    code?: string;
    body?: unknown;
  }) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

let refreshAccessTokenPromise: Promise<string | null> | null =
  null;

async function getBrowserAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { supabase } = await import(
      "@/lib/supabase/client"
    );

    const { data, error } =
      await supabase.auth.getSession();

    if (error) {
      return null;
    }

    return (
      data.session?.access_token ??
      null
    );
  } catch {
    return null;
  }
}

async function refreshBrowserAccessToken(): Promise<
  string | null
> {
  if (typeof window === "undefined") {
    return null;
  }

  if (refreshAccessTokenPromise) {
    return refreshAccessTokenPromise;
  }

  refreshAccessTokenPromise = (async () => {
    try {
      const { supabase } = await import(
        "@/lib/supabase/client"
      );

      const { data, error } =
        await supabase.auth.refreshSession();

      if (error) {
        return null;
      }

      return (
        data.session?.access_token ??
        null
      );
    } catch {
      return null;
    } finally {
      refreshAccessTokenPromise = null;
    }
  })();

  return refreshAccessTokenPromise;
}

async function parseResponseBody(
  response: Response
) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractError(
  body: unknown,
  fallback: string
): {
  code?: string;
  message: string;
} {
  if (
    !body ||
    typeof body !== "object"
  ) {
    if (
      typeof body === "string" &&
      body.trim()
    ) {
      return {
        message: body,
      };
    }

    return {
      message: fallback,
    };
  }

  const record =
    body as Record<string, unknown>;

  const detail = record.detail;

  if (typeof detail === "string") {
    return {
      message: detail,
    };
  }

  if (
    detail &&
    typeof detail === "object"
  ) {
    const detailRecord =
      detail as Record<
        string,
        unknown
      >;

    const code =
      typeof detailRecord.code ===
      "string"
        ? detailRecord.code
        : undefined;

    const message =
      typeof detailRecord.message ===
      "string"
        ? detailRecord.message
        : code
          ? code
              .replaceAll("_", " ")
              .toLowerCase()
          : fallback;

    return {
      code,
      message,
    };
  }

  const code =
    typeof record.code === "string"
      ? record.code
      : undefined;

  const message =
    typeof record.message === "string"
      ? record.message
      : code
        ? code
            .replaceAll("_", " ")
            .toLowerCase()
        : fallback;

  return {
    code,
    message,
  };
}

type ParsedApiResponse = {
  response: Response;
  body: unknown;
};

async function sendRequest(
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE",
  path: string,
  payload: unknown,
  accessToken: string | null,
): Promise<ParsedApiResponse> {
  const headers = new Headers();

  headers.set(
    "Accept",
    "application/json",
  );

  if (payload !== undefined) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      headers,
      body:
        payload === undefined
          ? undefined
          : JSON.stringify(payload),
      cache: "no-store",
    },
  );

  return {
    response,
    body: await parseResponseBody(response),
  };
}

async function request<T>(
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE",
  path: string,
  payload?: unknown,
): Promise<T> {
  const initialToken =
    await getBrowserAccessToken();

  let result = await sendRequest(
    method,
    path,
    payload,
    initialToken,
  );

  if (
    result.response.status === 401 &&
    typeof window !== "undefined"
  ) {
    const refreshedToken =
      await refreshBrowserAccessToken();

    if (refreshedToken) {
      result = await sendRequest(
        method,
        path,
        payload,
        refreshedToken,
      );
    }
  }

  if (!result.response.ok) {
    const fallback =
      `${method} ${path} failed with ${result.response.status}`;

    const extracted =
      extractError(
        result.body,
        fallback,
      );

    throw new ApiError({
      status: result.response.status,
      code: extracted.code,
      message: extracted.message,
      body: result.body,
    });
  }

  return result.body as T;
}

export async function apiGet<T>(
  path: string
): Promise<T> {
  return request<T>(
    "GET",
    path
  );
}

export async function apiPost<T>(
  path: string,
  payload?: unknown
): Promise<T> {
  return request<T>(
    "POST",
    path,
    payload
  );
}

export async function apiPut<T>(
  path: string,
  payload?: unknown
): Promise<T> {
  return request<T>(
    "PUT",
    path,
    payload
  );
}

export async function apiPatch<T>(
  path: string,
  payload?: unknown
): Promise<T> {
  return request<T>(
    "PATCH",
    path,
    payload
  );
}

export async function apiDelete<T>(
  path: string
): Promise<T> {
  return request<T>(
    "DELETE",
    path
  );
}

export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
};