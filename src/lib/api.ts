
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const { token, headers, ...requestOptions } = options;

  const requestHeaders = new Headers(headers);

  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`,
    {
      ...requestOptions,
      headers: requestHeaders,
      credentials: "include",
    }
  );

  const contentType = response.headers.get("content-type");

  const result = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

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
