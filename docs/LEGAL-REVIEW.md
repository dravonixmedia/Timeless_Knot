# Privacy Policy and Terms & Conditions — review before launch

`/privacy-policy` (`src/app/privacy-policy/page.tsx`) and `/terms-and-conditions`
(`src/app/terms-and-conditions/page.tsx`) are drafts written from what the website
actually does and from confirmed business facts only (`src/config/site.ts`). They
are **not legal advice**. Have them approved by the studio and, ideally, a lawyer
familiar with Indian law before launch. Each point below is also marked
`REVIEW:` in the page source.

When the text changes, update `UPDATED` at the top of the page file — it drives
the "Last updated" date.

## What the policy states about the website (verified in code)

- The contact form posts nowhere. It validates in the browser and opens
  `https://wa.me/917034671830?text=…` with the enquiry as the message; nothing
  reaches the studio until the visitor presses Send in WhatsApp. No backend,
  database or email service (`src/components/contact/EnquiryForm.tsx`,
  `src/lib/enquiry.ts`).
- The site sets no cookies of its own, uses no browser storage, and loads no
  analytics, advertising or social tracking scripts. Fonts are self-hosted
  (`next/font`). A test (`tests/legal.test.mjs`) fails if cookie, storage or
  common tracker calls are added to `src/` — update the policy first if that
  ever becomes intentional.
- Hosting, image optimisation and delivery run on Cloudflare Workers, with
  Workers observability (request logs) enabled (`wrangler.jsonc`).
- Films are served from the site itself; no YouTube or Vimeo embeds are
  published today. If an embed is added, mention it under Third-Party Services
  and Cookies.

## Needs confirmation by the studio

1. **Cloudflare dashboard settings for timelessknot.in.** The code adds no
   cookies or analytics, but Cloudflare can, outside this repository: Web
   Analytics (automatic setup), Bot Fight Mode / Super Bot Fight Mode,
   Turnstile, or challenge pages may set cookies such as `__cf_bm` or inject a
   beacon. Check them and adjust "Cookies and Website Analytics" if any are on.
2. **Workers log retention.** The policy says logs are kept "for limited
   periods". Confirm the plan's retention, or disable observability if logs
   are not needed.
3. **"We do not sell your personal information or use it for third-party
   advertising"** — a business commitment; confirm it.
4. **Collaborators.** "Information Sharing" allows sharing with people who help
   deliver a booked service (e.g. associate photographers, editors). Remove it
   if the studio never does this.
5. **Retention period** for WhatsApp enquiry conversations and booking
   records. The policy currently says "only as long as reasonably needed" —
   consider stating a concrete period.
6. **A privacy / grievance contact.** Only WhatsApp is confirmed today. Indian
   law (IT Rules 2011, rule 5(9); DPDP Act 2023) expects a named contact for
   grievances; add a name and a dedicated email address once available
   (`site.contact.email` in `src/config/site.ts` shows it automatically).
7. **Legal entity.** No registered business name or address is published
   (`site.legalName` is `null`). Add them to both pages if the studio is a
   registered entity.
8. **Ownership of published work and brand** (Terms §10). Confirm that all
   photographs, films and brand assets are owned by or licensed to the studio,
   including any shot by associate photographers.
9. **Portfolio consent** (Terms §11). The terms say identifiable clients are
   shown only with their agreement. Confirm permission is on record for every
   identifiable person in the published portfolio.

## Needs legal review

- **DPDP Act, 2023 and the DPDP Rules, 2025.** Obligations commence in phases.
  The rights listed (access, correction, erasure, withdrawal of consent,
  nomination, grievance, complaint to the Data Protection Board) and the wording
  "as its provisions come into force" should be checked, together with notice
  and consent requirements and the cross-border transfer sentence.
- **Children** — the policy treats under-18s as children, following the DPDP
  Act.
- **Limitation of liability** (Terms §16).
- **Governing law and jurisdiction** (Terms §17). India is stated; no specific
  court is named. The studio may want courts in Kollam, Kerala.
- **Booking agreement.** The terms defer pricing, payments, deposits, refunds,
  cancellation charges, deliverables, timelines and client usage rights to a
  separate written booking agreement. Make sure such an agreement exists and
  covers them; the website terms deliberately state none of them.
