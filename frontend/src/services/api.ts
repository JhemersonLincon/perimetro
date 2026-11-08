const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const TOKEN_STORAGE_KEY = "cronica_rpg_token";

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  try {
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    return url.startsWith("/") ? `${apiUrl.origin}${url}` : `${apiUrl.origin}/${url}`;
  } catch {
    return url;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = "Ocorreu um erro ao processar a requisição.";
    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
      }
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}
