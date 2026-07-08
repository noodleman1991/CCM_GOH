import Link from "next/link";
import Logo from "@/components/logo";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import { fetchSanityNavigation, fetchSanitySettings } from "@/sanity/lib/fetch";
import {
  getDynamicFetchOptions,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { NAVIGATION_QUERY_RESULT, SETTINGS_QUERY_RESULT } from "@/sanity.types";

type HeaderProps = {
  settings: SETTINGS_QUERY_RESULT;
  navigation: NAVIGATION_QUERY_RESULT;
};

export function Header({ settings, navigation }: HeaderProps) {
  return (
    <header className="sticky top-0 w-full border-border/40 bg-background/95 z-50">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" aria-label="Home page">
          <Logo settings={settings} />
        </Link>
        <div className="hidden xl:flex gap-7 items-center justify-between">
          <DesktopNav navigation={navigation} />
          <ModeToggle />
        </div>
        <div className="flex items-center xl:hidden">
          <ModeToggle />
          <MobileNav navigation={navigation} settings={settings} />
        </div>
      </div>
    </header>
  );
}

export function HeaderFallback() {
  return (
    <header
      aria-busy
      className="sticky top-0 w-full border-border/40 bg-background/95 z-50"
    >
      <div className="container h-14" />
    </header>
  );
}

export async function DynamicHeader() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedHeader perspective={perspective} stega={stega} />;
}

export async function CachedHeader({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const [settings, navigation] = await Promise.all([
    fetchSanitySettings({ perspective, stega }),
    fetchSanityNavigation({ perspective, stega }),
  ]);

  return <Header settings={settings} navigation={navigation} />;
}
