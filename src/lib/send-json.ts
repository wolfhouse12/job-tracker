export type SendResult = { ok: true; data: unknown } | { ok: false; error: string };

/**
 * fetch wrapper for the app's own API. Never throws: network failures and error responses both
 * come back as { ok: false, error } with a message that is safe to show the user.
 */
export async function sendJson(url: string, method: string, body?: unknown): Promise<SendResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data };
    if (res.status === 401) return { ok: false, error: "Your session has ended. Please sign in again." };
    const message = data && typeof data.error === "string" ? data.error : null;
    return { ok: false, error: message ?? "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
}
