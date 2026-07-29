"use client";

import { useTranslations } from "next-intl";
import { SignInButton, SignUpButton, SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { LayoutDashboard, LogOut, MessageSquare, Settings } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UnreadBadge } from "@/components/unread-badge";
import { useSidebar } from "@/components/ui/sidebar";
import { useHydrated } from "@/hooks/use-hydrated";
import { FEATURES } from "@/lib/features";
import { clerkAppearance } from "@/lib/clerk-appearance";

/**
 * The user area as ONE flat menu card (user direction 2026-07-05) — no
 * dropdown-behind-a-menu. Signed in: a static identity row, then the
 * destinations incl. sign-out, all visible. Signed out: the two auth actions
 * in the same card. Identical on the desktop rail and the mobile sheet.
 */
export function UserMenuCard() {
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const { user } = useUser();
  const { signOut } = useClerk();
  const { setOpenMobile } = useSidebar();
  // <ClerkProvider dynamic> gives the server the SESSION (so <SignedIn> renders
  // server-side), but never the User resource — that loads in the browser. Read
  // it only after hydration so the server render and the first client render
  // agree; otherwise the name/email/initials swap under React and mismatch.
  const hydrated = useHydrated();
  const identity = hydrated ? user : undefined;

  const row =
    "flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-white/10 hover:text-sidebar-foreground";
  const close = () => setOpenMobile(false);

  return (
    <div className="mx-2 mb-1 rounded-xl bg-white/5 p-1.5 group-data-[collapsible=icon]:hidden">
      <SignedIn>
        {/* Identity row — informational, not a trigger. */}
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar className="size-8">
            {identity?.imageUrl && <AvatarImage src={identity.imageUrl} alt="" />}
            <AvatarFallback className="bg-white/15 text-xs font-bold text-white">
              {(identity?.firstName?.[0] ?? "") + (identity?.lastName?.[0] ?? "") || "•"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-bold text-sidebar-foreground">
              <bdi>{identity?.fullName ?? ""}</bdi>
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              {identity?.primaryEmailAddress?.emailAddress ?? ""}
            </p>
          </div>
        </div>
        <nav aria-label={t("userMenu")} className="grid gap-0.5 border-t border-white/10 pt-1.5">
          <Link href="/dashboard" className={row} onClick={close}>
            <LayoutDashboard className="size-4 opacity-70" aria-hidden />
            {t("userDashboard")}
          </Link>
          {FEATURES.engagement && (
            <Link href="/messages" className={row} onClick={close}>
              <MessageSquare className="size-4 opacity-70" aria-hidden />
              {t("userMessages")}
              <span className="ms-auto">
                <UnreadBadge />
              </span>
            </Link>
          )}
          <Link href="/dashboard/settings" className={row} onClick={close}>
            <Settings className="size-4 opacity-70" aria-hidden />
            {t("userSettings")}
          </Link>
          <button
            type="button"
            className={row}
            onClick={() => {
              close();
              signOut();
            }}
          >
            <LogOut className="size-4 opacity-70" aria-hidden />
            {tAuth("signOut")}
          </button>
        </nav>
      </SignedIn>

      <SignedOut>
        <div className="grid gap-1.5 p-1">
          <SignUpButton mode="modal" appearance={clerkAppearance}>
            <Button className="w-full rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
              {tAuth("createAccount")}
            </Button>
          </SignUpButton>
          <SignInButton mode="modal" appearance={clerkAppearance}>
            <Button className="w-full rounded-lg border border-white/20 bg-transparent text-sidebar-foreground hover:bg-white/10">
              {tAuth("signIn")}
            </Button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  );
}
