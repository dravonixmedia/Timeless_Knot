/**
 * WhatsApp helpers. The number is never hard-coded: it comes from
 * NEXT_PUBLIC_WHATSAPP_NUMBER (see `site.contact.whatsapp`) and is only
 * accepted when it looks like a real international number.
 */

export const whatsappMessage =
  "Hello Timeless Knot, I’d love to know more about your wedding photography and cinematography services.";

/**
 * Normalises a configured number to the digits-only international format that
 * wa.me expects (country code first, no "+", spaces or leading zeros).
 * Returns null for anything that is not a plausible E.164 number (8–15 digits).
 */
export function normalizeWhatsappNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Only digits, spaces, dashes, dots, parentheses and one leading "+" are allowed.
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return digits;
}

/** Official click-to-chat link with an optional prefilled message. */
export function whatsappHref(number: string, message: string = whatsappMessage) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
