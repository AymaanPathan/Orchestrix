/**
 * maskUri.ts — masks credentials in a MongoDB URI for display purposes.
 */
export function maskUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) url.password = "••••••••";
    if (url.username) url.username = url.username.charAt(0) + "•••";
    return url.toString();
  } catch {
    return uri.slice(0, 14) + "••••••••" + uri.slice(-6);
  }
}
