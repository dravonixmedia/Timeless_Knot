import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Suspense } from "react";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { RouteChrome } from "@/components/layout/RouteChrome";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/contact/WhatsAppButton";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { JsonLd, organizationSchema } from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Wedding Photography & Cinematography`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — Wedding Photography & Cinematography`,
    description: site.description,
    url: "/",
    locale: "en",
  },
  twitter: { card: "summary_large_image" },
  robots: site.hasProductionUrl ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#263a31",
  colorScheme: "light",
};

/*
 * Adds `js` before first paint so scroll-reveal hidden states never flash.
 * If the client bundle fails to boot within 4s, the class is removed and all
 * content is shown — animation must never hide content.
 */
const bootScript = `(function(d){d.classList.add('js');setTimeout(function(){if(!d.classList.contains('reveal-ready'))d.classList.remove('js')},4000)})(document.documentElement)`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <JsonLd data={organizationSchema()} />
        <Suspense fallback={<Header pathname={null} />}>
          <RouteChrome />
        </Suspense>
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
        <SmoothScroll />
        <RevealObserver />
      </body>
    </html>
  );
}
