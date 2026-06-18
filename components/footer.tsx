"use client";

import { Link } from "@/i18n/navigation";
import Logo from "@/components/logo";
import { useTranslations } from "next-intl";
import { CookiePreferencesButton } from "@/components/cookie-consent/cookie-preferences-button";

export default function Footer() {
  const t = useTranslations("navigation");
  const navItems = [
    { label: t("home"), href: "/" },
    { label: t("blog"), href: "/blog" },
    { label: t("about"), href: "/about" },
    { label: t("readAgenda"), href: "/reader" },
    { label: t("privacy"), href: "/legal/privacy" },
    { label: t("terms"), href: "/legal/terms" },
  ];
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <footer>
      <div className="dark:bg-background pb-5 xl:pb-5 dark:text-gray-300">
        <Link
          className="block w-[6.25rem] mx-auto"
          href="/"
          aria-label="Home page"
        >
          <Logo asChild />
        </Link>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-7 text-primary">
          {navItems.map((navItem) => (
            <Link
              key={navItem.href}
              href={navItem.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60 text-sm"
            >
              {navItem.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-col lg:flex-row gap-6 items-center justify-center text-center lg:mt-5 text-xs border-t pt-8">
          <p className="text-foreground/60">
            &copy; {getCurrentYear()} Built by{" "}
            <a href="https://x.com/serge_0v" target="_blank" rel="noopener" className="hover:underline">
              @serge_0v
            </a>
            .
          </p>
          <CookiePreferencesButton />
        </div>
      </div>
    </footer>
  );
}
