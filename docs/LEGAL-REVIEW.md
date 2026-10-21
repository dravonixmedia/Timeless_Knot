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

## Statements that depend on things outside this repository

These are published, but cannot be proven from the code. Check each before launch.

| Statement | Depends on |
| --- | --- |
| "Cloudflare may set strictly necessary cookies…" and "This website does not set cookies of its own… or analytics" | Cloudflare dashboard for the production zone: Web Analytics (automatic setup), Bot Fight Mode / Super Bot Fight Mode, Turnstile and challenge pages can add cookies (e.g. `__cf_bm`) or a beacon without any code change. If any are on, update "Cookies and Website Analytics". |
| "…may be recorded in technical logs", "kept by Cloudflare for limited periods" | Workers observability (`wrangler.jsonc`) and the account plan's log retention. |
| "served over an encrypted (HTTPS) connection" | Cloudflare SSL/TLS settings ("Always Use HTTPS"). |
| WhatsApp handling of the prepared message, and where providers process data | WhatsApp's and Cloudflare's own policies (linked from the page). |
| Enquiry conversations are kept in the studio's WhatsApp account and devices; kept only as long as needed, then deleted; reasonable care is taken to protect them | Studio practice — confirm (questions 3–4). |
| Requests under "Your Privacy Rights" are answered within a reasonable time | Studio practice and the DPDP Act timelines — confirm (question 5). |
| A booking is confirmed only when the studio confirms it in writing | Studio practice — confirm (question 8). |
| Website content is "owned by or licensed to Timeless Knot" (matches the footer's existing "© Timeless Knot. All rights reserved.") | Ownership of every published photograph, film and brand asset — confirm (question 9). |

## Removed until the studio confirms them

These were in the first draft but are business commitments the code cannot
show. They are **not** published. Suggested wording, if confirmed:

- Privacy, How We Use Your Information: "We do not sell your personal
  information, and we do not use it for third-party advertising."
- Privacy, Information Sharing: "We share it with people who help us deliver
  a service you have booked (such as associate photographers or editors), only
  where necessary and only for that booking."
- Privacy, Children's Privacy: "Photographs and films of children taken at a
  booked event are covered by the agreement with our client."
- Terms, Portfolio Usage: "We feature identifiable clients only where they have
  agreed, whether in their booking agreement or separately." and "We will
  respond promptly" to removal requests.
- Terms, Intellectual Property: a reference to the Trade Marks Act, 1999 —
  only appropriate if "Timeless Knot" or the TK monogram is a registered (or
  applied-for) trade mark.

## Information the owner must supply (nothing has been invented)

- **Legal identity.** No registered business name, entity type, GST number or
  address is published (`site.legalName` is `null`; the pages name "Timeless
  Knot, Kollam, Kerala, India", which is confirmed). Supply them if the studio
  is a registered entity.
- **Privacy / grievance contact.** Only WhatsApp (+91 70346 71830, already
  configured) is published. Indian law (IT Rules 2011, rule 5(9); DPDP Act
  2023) expects a contact for privacy requests and grievances, ideally a named
  person and an email address. Setting `site.contact.email` in
  `src/config/site.ts` adds the address to both pages automatically.

## Questions for the owner

1. Which Cloudflare security/analytics features are on for the production domain?
2. How long are Workers request logs kept, and are they needed?
3. How long should WhatsApp enquiries and booking records be kept? (A concrete period is better than "as long as needed".)
4. Who can access the studio's WhatsApp account and devices that hold enquiries?
5. Who answers privacy requests, and within what time?
6. Does the studio ever sell or share client details for advertising? (If not, the "we do not sell" sentence can be restored.)
7. Does the studio share client details with associate photographers, editors or other collaborators?
8. How is a booking confirmed today — in writing (WhatsApp/email), by signed agreement, by payment?
9. Does the studio own, or hold a licence for, every photograph, film and brand asset on the site, including work by any second shooters?
10. Is written permission on record for every identifiable person shown in the portfolio and films? (If yes, the portfolio-consent sentence can be restored.)
11. Is "Timeless Knot" or the TK monogram a registered trade mark?
12. Is the studio a registered entity (name, address)? Which privacy contact (name, email) should be published?
13. Does a written booking agreement exist covering deposits, payment schedule, cancellation, refunds, rescheduling, delivery timelines and the client's usage rights? The website terms defer to it and state none of these.
14. Should disputes name specific courts (for example Kollam, Kerala)?

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
  court is named.

## Before publishing

Once approved, set `UPDATED` in both page files to the approval date: it is the
"Last updated" date visitors see. `REVIEW:` notes are source comments only and
are never rendered (`tests/legal.test.mjs` checks this).
