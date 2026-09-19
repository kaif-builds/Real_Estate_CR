/**
 * DEV-ONLY API Client — attaches mock auth headers to all outgoing requests.
 *
 * TEMPORARY: This entire file will be removed once real authentication is
 * implemented. It exists so that frontend pages can call protected backend
 * endpoints during development without a real auth flow.
 *
 * Usage:
 *   import { apiClient } from "@/lib/apiClient";
 *   const data = await apiClient.get("/api/leads");
 *
 * How it works:
 * - All requests go to relative "/api/*" URLs (proxied to backend by Next.js rewrites).
 * - X-Mock-Role and X-Mock-User-Id headers are attached from the mock user.
 * - Call setMockUser() to switch roles during development.
 */

export type MockRole = "SUPER_ADMIN" | "OFFICE_EXECUTIVE" | "AGENT" | "CLIENT";

export interface MockUser {
  id: string;
  email: string;
  role: MockRole;
  name?: string;
}

// Default mock user — Super Admin for full access during dev
let currentMockUser: MockUser = {
  id: "u1",
  email: "admin@propdesk.in",
  role: "SUPER_ADMIN",
};

/**
 * Switch the mock user for development. Call this from browser console
 * or from a dev-only role-switcher component.
 *
 * Example:
 *   setMockUser({ id: "u3", email: "agent@propdesk.in", role: "AGENT" })
 */
export function setMockUser(user: MockUser): void {
  currentMockUser = user;
}

export function getMockUser(): MockUser {
  return { ...currentMockUser };
}

/**
 * Make an authenticated API request with mock headers attached.
 */
async function request<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Attach mock auth headers
  headers.set("X-Mock-Role", currentMockUser.role);
  headers.set("X-Mock-User-Id", currentMockUser.id);
  headers.set("X-Mock-Email", currentMockUser.email);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API ${response.status}: ${response.statusText} — ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

/** Convenience methods */
export const apiClient = {
  get: <T = unknown>(url: string) => request<T>(url),

  post: <T = unknown>(url: string, body: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T = unknown>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T = unknown>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T = unknown>(url: string) =>
    request<T>(url, { method: "DELETE" }),
};

/** Top-level shorthands for cleaner imports in page components. */
export const apiGet = <T = unknown>(url: string): Promise<T> => request<T>(url);
export const apiPost = <T = unknown>(url: string, body: unknown): Promise<T> =>
  request<T>(url, { method: "POST", body: JSON.stringify(body) });
