// ------------------------------------------------------------------
// app/components/Footer/Footer.tsx  (Server Component • A11y fixed)
// ------------------------------------------------------------------
import React from "react";
import Link from "next/link";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaArrowRight } from "react-icons/fa";
import { fetchData } from "@/lib/fetchData";
import LogoComponent from "@/components/menu/LogoComponent";

export interface FooterData {
  name: string;
  logoImageUrl: string;
  address: string;
  city: string;
  zipcode: string;
  governorate: string;
  email: string;
  phone?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
}

export const revalidate = 60;

/** Normalize external links to absolute https URLs */
const toHttps = (href?: string) =>
  !href ? undefined : href.startsWith("http://") || href.startsWith("https://") ? href : `https://${href.replace(/^\/+/, "")}`;

/** Visually-hidden text utility for SR-only labels (Tailwind has .sr-only; keep for safety) */
const SrOnly = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

/** Icon-only <a> with discernible name (WCAG/axe link-name fix) 
 *  - anchor gets aria-label + title (accessible name) :contentReference[oaicite:0]{index=0}
 *  - icon is decorative (aria-hidden/focusable=false) :contentReference[oaicite:1]{index=1}
 */
function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const normalized = toHttps(href)!;
  return (
    <a
      href={normalized}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="text-white transition transform duration-200 hover:scale-110 hover:text-secondary
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary rounded-sm"
    >
      <span aria-hidden="true">{children}</span>
      <SrOnly>{label}</SrOnly>
    </a>
  );
}

export default async function Footer() {
  const data: FooterData = await fetchData<FooterData>("/website/header/getFooterData").catch(
    () =>
      ({
        name: "",
        logoImageUrl: "",
        address: "",
        city: "",
        zipcode: "",
        governorate: "",
        email: "",
        phone: undefined,
        facebook: undefined,
        linkedin: undefined,
        instagram: undefined,
      } as FooterData)
  );

  const {
    name,
    address,
    city,
    zipcode,
    governorate,
    email,
    phone,
    facebook,
    linkedin,
    instagram,
  } = data;

  const phoneDigits = (phone || "").replace(/\D/g, "");
  const hasPhone = phoneDigits.length > 0;
  const phoneDisplay =
    hasPhone && phoneDigits.length === 8
      ? `${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2, 5)} ${phoneDigits.slice(5)}`
      : phoneDigits;
  const phoneHref = hasPhone ? `tel:+216${phoneDigits}` : undefined;
  const emailHref = email ? `mailto:${email}` : undefined;

  return (
    <div className="pt-8 flex flex-col justify-center items-center">
      {/* Top Section */}
      <div className="bg-primary gap-4 text-white flex justify-center py-8 max-md:py-6 w-full">
        <div className="flex items-start justify-between md:max-lg:justify-around w-[85%] max-xl:w-[90%] max-lg:w-[98%] max-md:w-[95%] max-md:flex-col max-md:items-center max-md:gap-[40px]">
          {/* Left */}
          <div className="flex flex-col gap-4 items-center">
            <LogoComponent />

            <div className="gap-4 flex flex-col max-md:items-center w-[80%] md:w-full">
              <p className="flex items-center justify-center gap-2 w-full">
                <FiMapPin size={32} className="shrink-0 flex-none" aria-hidden="true" focusable="false" />
                <span className="text-sm text-center leading-snug flex-1">
                  {address}, {zipcode} {city} {governorate}
                </span>
              </p>

              {hasPhone && (
                <p className="flex items-center justify-center gap-2 w-full">
                  <FiPhone size={25} className="shrink-0 flex-none" aria-hidden="true" focusable="false" />
                  <a
                    href={phoneHref}
                    aria-label={`Téléphoner au +216 ${phoneDisplay}`}
                    className="text-sm underline underline-offset-2 hover:no-underline
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary rounded-sm"
                  >
                    +216 {phoneDisplay}
                  </a>
                </p>
              )}

              <p className="flex items-center justify-center gap-2 w-full">
                <FiMail size={25} className="shrink-0 flex-none" aria-hidden="true" focusable="false" />
                {emailHref ? (
                  <a
                    href={emailHref}
                    aria-label={`Envoyer un email à ${email}`}
                    className="text-sm break-words underline underline-offset-2 hover:no-underline
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary rounded-sm"
                  >
                    {email}
                  </a>
                ) : (
                  <span className="text-sm break-words">{email}</span>
                )}
              </p>
            </div>
          </div>

          {/* Middle (internal links already have visible text → OK) */}
          <div className="flex w-1/5 max-md:w-full justify-between max-md:justify-center items-center gap-4 max-md:gap-20 md:max-lg:hidden">
            <div className="flex flex-col gap-[16px] max-md:text-sm">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/privacy" className="hover:text-white">Politique de confidentialité</Link>
              <Link href="/contactus" className="hover:text-white">Contactez-nous</Link>
              <Link href="/blog" className="hover:text-white">Blogs</Link>
            </div>
            <div className="flex flex-col gap-[16px]">
              <ul className="flex flex-col text-lg max-md:text-sm gap-[8px]">
                {["Monastir", "Sousse", "Mahdia", "Nabeul", "Sfax"].map((c) => (
                  <li key={c} className="hover:text-white">{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-[16px] items-center">
            <p className="max-md:text-sm text-xl">Abonnez-vous à notre newsletter!</p>
            <div className="relative w-full">
              <label htmlFor="newsletter-email" className="sr-only">Adresse e-mail</label>
              <input
                id="newsletter-email"
                className="w-full h-12 px-4 py-2 max-md:h-12 rounded-full border text-black border-gray-300 pr-16"
                type="email"
                placeholder="Email address"
                autoComplete="email"
              />
              <div className="absolute right-2 top-1/2 group overflow-hidden -translate-y-1/2">
                <button
                  type="button"
                  className="relative py-2 w-10 h-10 rounded-full text-white bg-primary hover:bg-[#15335D]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
                  aria-label="Envoyer l'adresse e-mail"
                  title="Envoyer"
                />
                <FaArrowRight className="absolute cursor-pointer top-1/2 right-1/2 -translate-y-1/2 translate-x-1/2 duration-500 lg:group-hover:translate-x-[250%]" aria-hidden="true" focusable="false" />
                <FaArrowRight className="absolute cursor-pointer top-1/2 right-[150%] -translate-y-1/2 translate-x-1/2 duration-500 lg:group-hover:translate-x-[300%]" aria-hidden="true" focusable="false" />
              </div>
            </div>

            <p className="text-xl max-md:text-sm">Suivez-nous sur :</p>
            <div className="flex items-center gap-[8px]">
              {linkedin && (
                <SocialIconLink href={linkedin} label="LinkedIn">
                  <FaLinkedinIn size={25} aria-hidden="true" focusable="false" />
                </SocialIconLink>
              )}
              {facebook && (
                <SocialIconLink href={facebook} label="Facebook">
                  <FaFacebookF size={25} aria-hidden="true" focusable="false" />
                </SocialIconLink>
              )}
              {instagram && (
                <SocialIconLink href={instagram} label="Instagram">
                  <FaInstagram size={25} aria-hidden="true" focusable="false" />
                </SocialIconLink>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="w-[90%] text-[20px] items-center justify-between text-[#525566] py-2 flex max-md:flex-col gap-[8px]">
        <p className="font-bold text-sm max-lg:text-sm">© {name} - All rights reserved</p>
        <div className="flex items-center text-sm max-lg:text-[10px] gap-4 justify-between">
          <Link href="/terms" className="hover:text-[#15335e] underline underline-offset-2">Terms and conditions</Link>
          <Link href="/privacy" className="hover:text-[#15335e] underline underline-offset-2">Privacy Policy</Link>
          <Link href="/disclaimer" className="hover:text-[#15335e] underline underline-offset-2">Disclaimer</Link>
        </div>
      </div>
    </div>
  );
}
