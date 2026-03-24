export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

// WebSocket URL — swap http(s) for ws(s) automatically
export const WS_BASE = API_BASE.replace(/^http/, "ws");

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
