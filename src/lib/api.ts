
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiOptions = RequestInit & {
  token?: string;
  auth?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const {
    token,
    auth = false,
    headers,
    ...requestOptions
  } = options;

  const requestHeaders = new Headers(headers);

  // Automatically set JSON content type
  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Get Better Auth JWT for protected API requests
  let accessToken = token;

  if (auth && !accessToken) {
    const { data, error } = await authClient.token();

    if (error || !data?.token) {
      throw new Error(
        error?.message || "Authentication required. Please login again."
      );
    }

    accessToken = data.token;
  }

  // Attach Bearer token
  if (accessToken) {
    requestHeaders.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  const response = await fetch(
    `${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`,
    {
      ...requestOptions,
      headers: requestHeaders,
      credentials: "include",
    }
  );

  // Parse API response
  const contentType = response.headers.get("content-type");

  const result = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  // Handle API errors
  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null
        ? result.message || result.error?.message
        : result;

    throw new Error(
      message || `Request failed with status ${response.status}`
    );
  }

  return result as T;
}
