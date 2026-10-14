import { parseEnquiry, validateEnquiry, type EnquiryResult } from "@/lib/enquiry";

/**
 * Receives contact enquiries and forwards them to the configured integration.
 *
 * Integration point: set ENQUIRY_WEBHOOK_URL to any endpoint that accepts a
 * JSON POST (form service, CRM, automation webhook, or a mail-sending function).
 * Without it, the route answers 503 with reason "demo" and never pretends to
 * have delivered anything.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid" } satisfies EnquiryResult, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (body && typeof body === "object" && (body as Record<string, unknown>).company) {
    return Response.json({ ok: false, reason: "invalid" } satisfies EnquiryResult, { status: 400 });
  }

  const enquiry = parseEnquiry(body);
  const errors = validateEnquiry(enquiry);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, reason: "invalid", errors } satisfies EnquiryResult, { status: 422 });
  }

  const endpoint = process.env.ENQUIRY_WEBHOOK_URL;
  if (!endpoint) {
    return Response.json({ ok: false, reason: "demo" } satisfies EnquiryResult, { status: 503 });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...enquiry, source: "timeless-knot-website", receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
  } catch (error) {
    console.error("Enquiry delivery failed", error);
    return Response.json({ ok: false, reason: "delivery" } satisfies EnquiryResult, { status: 502 });
  }

  return Response.json({ ok: true } satisfies EnquiryResult);
}
