import Link from "next/link";
import { useTranslations } from "next-intl";
import Logo from "@/components/logo";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";

const navItems = [
  {
    label: "Home",
    href: "/",
    target: false,
  },
  {
    label: "Blog",
    href: "/blog",
    target: false,
  },
  {
    label: "About",
    href: "/about",
    target: false,
  },
];

export default function Header() {
    const t = useTranslations("common");
  return (
    <header className="sticky top-0 w-full border-border/40 bg-background/95 z-50">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Mobile menu - positioned absolute left */}
        <div className="flex items-center xl:hidden absolute start-4">
          <ModeToggle />
          <MobileNav navItems={navItems} />
        </div>

        {/* Logo - centered on mobile, left-aligned on desktop */}
        <Link href="/" aria-label={t("goToHomepage")} className="flex-shrink-0 mx-auto xl:mx-0">
          <Logo asChild />
        </Link>

        {/* Desktop navigation - right side */}
        <div className="hidden xl:flex gap-7 items-center justify-between">
          <DesktopNav navItems={navItems} />
          <ModeToggle />
        </div>

        {/* Spacer for mobile to balance centering */}
        <div className="w-20 xl:hidden"></div>
      </div>
    </header>
  );
}
