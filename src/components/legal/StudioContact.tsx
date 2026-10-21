import Link from "next/link";
import { site } from "@/config/site";
import { whatsappNumber } from "@/lib/whatsapp";

/** "917034671830" → "+91 70346 71830"; other numbers simply get a leading +. */
export function formatWhatsappNumber(digits: string) {
  return digits.length === 12 && digits.startsWith("91")
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : `+${digits}`;
}

/**
 * How to reach the studio, from confirmed details only (src/config/site.ts):
 * the city-level base, the configured WhatsApp chat and the contact page. An
 * email address or phone number appears only once one is configured.
 */
export function StudioContact() {
  const { email, phone, whatsapp } = site.contact;
  const number = whatsappNumber(whatsapp);
  return (
    <ul>
      <li>
        {site.name}, {site.location.locality}, {site.location.region}, {site.location.country}
      </li>
      {whatsapp && number && (
        <li>
          WhatsApp:{" "}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            {formatWhatsappNumber(number)}
          </a>
        </li>
      )}
      {email && (
        <li>
          Email: <a href={`mailto:${email}`}>{email}</a>
        </li>
      )}
      {phone && (
        <li>
          Phone: <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
        </li>
      )}
      <li>
        Or use the enquiry form on our <Link href="/contact">contact page</Link>.
      </li>
    </ul>
  );
}
