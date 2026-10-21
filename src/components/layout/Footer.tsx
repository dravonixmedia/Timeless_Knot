import Link from "next/link";
import { site } from "@/config/site";
import { Logo } from "@/components/brand/Logo";
import { EucalyptusSprig } from "@/components/brand/Botanical";
import { CurrentYear } from "./CurrentYear";

export function Footer() {
  const { email, phone, whatsapp } = site.contact;
  const hasContact = Boolean(email || phone || whatsapp || site.social.instagram);

  return (
    <footer className="relative overflow-hidden bg-forest text-ivory">
      <EucalyptusSprig className="pointer-events-none absolute -right-16 top-10 hidden h-[34rem] w-auto rotate-[14deg] text-sage opacity-[0.14] md:block" />

      {/* Extra bottom clearance keeps the credit row clear of the floating WhatsApp button. */}
      <div className={`frame relative pt-[var(--section-tight)] ${whatsapp ? "pb-28" : "pb-10"}`}>
        <div className="editorial-grid gap-y-16">
          <div className="col-span-12 lg:col-span-6">
            <Link href="/" aria-label={`${site.name} — home`} className="inline-block">
              <Logo />
            </Link>
            <p className="mt-10 max-w-[18ch] font-serif text-[clamp(2rem,1.4rem+2.2vw,3.4rem)] font-light italic leading-[1.08] text-pale-sage">
              {site.tagline}
            </p>
            <p className="mt-8 max-w-[34ch] text-[0.95rem] text-ivory/75">{site.positioning}</p>
          </div>

          <nav aria-label="Footer" className="col-span-6 sm:col-span-4 lg:col-span-3">
            <p className="eyebrow mb-6 text-sage">Explore</p>
            <ul className="space-y-3">
              {[{ label: "Home", href: "/" }, ...site.nav].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-draw text-[0.95rem] text-ivory/85 hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-6 sm:col-span-8 lg:col-span-3">
            <p className="eyebrow mb-6 text-sage">Connect</p>
            <ul className="space-y-3 text-[0.95rem] text-ivory/85">
              {site.social.instagram && (
                <li>
                  <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="link-draw hover:text-ivory">
                    Instagram
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="link-draw hover:text-ivory">
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-draw hover:text-ivory">
                    {phone}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="link-draw hover:text-ivory">
                    WhatsApp
                  </a>
                </li>
              )}
              <li>
                <Link href="/contact" className="link-draw hover:text-ivory">
                  {hasContact ? "Send an enquiry" : "Tell us your story"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-[var(--section-tight)] flex flex-col gap-4 border-t border-ivory/15 pt-8 text-[0.78rem] text-ivory/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {site.name}. All rights reserved.
          </p>
          <a href={site.credit.href} target="_blank" rel="noopener" className="link-draw hover:text-ivory">
            {site.credit.label}
          </a>
        </div>
      </div>
    </footer>
  );
}
