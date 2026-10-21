/**
 * WhatsApp link handling.
 *
 * The site uses one direct click-to-chat link (configured in
 * src/config/site.ts) for the floating button, the footer, the contact page
 * and the contact form's WhatsApp enquiries. Only genuine https://wa.me/ links are accepted — any other scheme or
 * domain is rejected, so a typo can never turn into an unsafe or unrelated link.
 *
 * This module has no imports so it can be unit-tested directly with Node.
 */

export const whatsappMessage =
  "Hello Timeless Knot, I’d love to know more about your wedding photography and cinematography services.";

/** wa.me/<international number>, digits only, 8–15 digits, no leading zero. */
const PHONE_PATH = /^\/([1-9]\d{7,14})\/?$/;
/** wa.me/message/<code> — WhatsApp Business short links (carry their own message). */
const MESSAGE_PATH = /^\/message\/([A-Za-z0-9]{4,64})\/?$/;

/**
 * Validates and normalises a direct WhatsApp link.
 *
 * Accepts `https://wa.me/<number>` (optionally with `?text=…`) and
 * `https://wa.me/message/<code>`. Returns a clean link — adding the studio's
 * prefilled message to number links that have none — or `null` when the value
 * is missing or not a safe wa.me URL.
 */
export function resolveWhatsappUrl(value: string | null | undefined, message: string = whatsappMessage): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.hostname !== "wa.me") return null;
  if (url.username || url.password || url.port || url.hash) return null;
  // Only the official `text` parameter is allowed.
  for (const key of url.searchParams.keys()) if (key !== "text") return null;

  const phone = PHONE_PATH.exec(url.pathname);
  if (phone) {
    const text = url.searchParams.get("text")?.trim() || message;
    return `https://wa.me/${phone[1]}?text=${encodeURIComponent(text)}`;
  }

  const code = MESSAGE_PATH.exec(url.pathname);
  if (code && !url.search) return `https://wa.me/message/${code[1]}`;

  return null;
}

/**
 * The international number (digits only) behind a direct link produced by
 * resolveWhatsappUrl — the same number the floating button opens. Null for a
 * WhatsApp Business short link (wa.me/message/…), which cannot carry a custom
 * message, or when no link is configured.
 */
export function whatsappNumber(link: string | null | undefined): string | null {
  const resolved = resolveWhatsappUrl(link);
  if (!resolved) return null;
  return PHONE_PATH.exec(new URL(resolved).pathname)?.[1] ?? null;
}

/**
 * A click-to-chat link that opens WhatsApp (the app on phones, WhatsApp Web on
 * desktop) with `message` ready to send. Line breaks, emoji and every reserved
 * character are percent-encoded, so the text arrives exactly as written.
 */
export function whatsappChatUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
