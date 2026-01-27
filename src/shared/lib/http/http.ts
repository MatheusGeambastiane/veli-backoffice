export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type HttpOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  baseUrl?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  signal?: AbortSignal;
};

export type HttpErrorPayload = {
  status: number;
  message: string;
  details?: unknown;
};

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(payload: HttpErrorPayload) {
    super(payload.message);
    this.name = "HttpError";
    this.status = payload.status;
    this.details = payload.details;
  }
}

async function getAccessToken() {
  if (typeof window === "undefined") {
    const { getServerSession } = await import("@/shared/auth/getServerSession");
    const session = await getServerSession();
    return session?.accessToken;
  }

  const { getSession } = await import("next-auth/react");
  const session = await getSession();
  return session?.accessToken;
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const url = `${baseUrl}${path}`;
  const hasBody = typeof options.body !== "undefined";
  const isFormData = hasBody && options.body instanceof FormData;
  const accessToken = await getAccessToken().catch(() => undefined);
  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: hasBody ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
    cache: options.cache,
    next: options.next,
    signal: options.signal,
  });

  if (!response.ok) {
    let details: unknown = undefined;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    throw new HttpError({
      status: response.status,
      message: "Request failed",
      details,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, options?: HttpOptions) => http<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: HttpOptions) =>
    http<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: HttpOptions) =>
    http<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: HttpOptions) => http<T>(path, { ...options, method: "DELETE" }),
};
