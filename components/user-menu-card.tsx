"use client";

import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SignInButton, SignUpButton, SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, MessageSquare, Settings } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnreadBadge } from "@/components/unread-badge";
import { useSidebar } from "@/components/ui/sidebar";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCollaboration } from "@/hooks/use-collaboration";
import { clerkAppearance } from "@/lib/clerk-appearance";

/**
 * The user area as ONE menu card (user direction 2026-07-05). Signed in: the
 * identity row is a toggle and the destinations incl. sign-out fold under it,
 * closed by default (user, 2026-09-30) — open, the card pushed the main menu
 * out of view in the drawer. Unread messages still show on the folded row.
 * Signed out: the two auth actions in the same card. Identical on the desktop
 * rail and the mobile sheet.
 */
export function UserMenuCard() {
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const { user } = useUser();
  const { signOut } = useClerk();
  const { setOpenMobile, isRtl } = useSidebar();
  // <ClerkProvider dynamic> gives the server the SESSION (so <SignedIn> renders
  // server-side), but never the User resource — that loads in the browser. Read
  // it only after hydration so the server render and the first client render
  // agree; otherwise the name/email/initials swap under React and mismatch.
  const hydrated = useHydrated();
  const access = useCollaboration();
  // The Messages page also holds Notifications; it opens when either is on.
  const inbox = access.messages || access.notifications;
  const identity = hydrated ? user : undefined;

  const row =
    "flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-white/10 hover:text-sidebar-foreground";
  const close = () => setOpenMobile(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountNavId = useId();

  // The three account destinations, shared verbatim between the expanded
  // card's inline <nav> and the collapsed rail's dropdown menu below — one
  // definition so the two surfaces can't drift.
  const accountLinks: {
    href: string
    icon: typeof LayoutDashboard
    label: string
    badge?: ReactNode
  }[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("userDashboard") },
    ...(inbox
      ? [{ href: "/messages", icon: MessageSquare, label: t(access.messages ? "userMessages" : "userNotifications"), badge: <UnreadBadge /> }]
      : []),
    { href: "/dashboard/settings", icon: Settings, label: t("userSettings") },
  ];

  const identityRow = (
    <div className="flex items-center gap-2.5 px-2 py-2">
      <Avatar className="size-8">
        {identity?.imageUrl && <AvatarImage src={identity.imageUrl} alt="" />}
        <AvatarFallback className="bg-muted text-xs font-bold">
          {(identity?.firstName?.[0] ?? "") + (identity?.lastName?.[0] ?? "") || "•"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-bold text-foreground">
          <bdi>{identity?.fullName ?? ""}</bdi>
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {identity?.primaryEmailAddress?.emailAddress ?? ""}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Expanded rail: flat menu card. */}
      <div className="mx-2 mb-1 rounded-xl bg-white/5 p-1.5 group-data-[collapsible=icon]:hidden">
        <SignedIn>
          {/* Identity row — toggles the account links below (closed by default). */}
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-controls={accountNavId}
            aria-label={t("userMenu")}
            onClick={() => setAccountOpen((open) => !open)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60"
          >
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
            {!accountOpen && inbox && (
              <span className="ms-auto">
                <UnreadBadge />
              </span>
            )}
            <ChevronDown
              className={`size-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200 motion-reduce:transition-none ${accountOpen ? "rotate-180" : ""} ${!accountOpen && inbox ? "" : "ms-auto"}`}
              aria-hidden
            />
          </button>
          <nav
            id={accountNavId}
            aria-label={t("userMenu")}
            hidden={!accountOpen}
            className="relative mt-1.5 grid gap-0.5 pt-2 before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-white/10"
          >
            {accountLinks.map(({ href, icon: Icon, label, badge }) => (
              <Link key={href} href={href} className={row} onClick={close}>
                <Icon className="size-4 opacity-70" aria-hidden />
                {label}
                {badge && <span className="ms-auto">{badge}</span>}
              </Link>
            ))}
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
              <Button className="w-full rounded-lg border border-white/25 bg-transparent text-sidebar-foreground hover:border-transparent hover:bg-white/15">
                {tAuth("signIn")}
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>

      {/* Collapsed rail: avatar-only trigger opening the SAME account menu as
          the card above (user direction 2026-08-05) — previously the whole
          card just vanished behind group-data-[collapsible=icon]:hidden,
          leaving no user affordance at all in the icon rail. */}
      <div className="hidden justify-center px-2 pb-1 group-data-[collapsible=icon]:flex">
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("userMenu")}
                className="mx-auto rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                <Avatar className="size-9 ring-2 ring-white/20 transition-shadow hover:ring-white/40">
                  {identity?.imageUrl && <AvatarImage src={identity.imageUrl} alt="" />}
                  <AvatarFallback className="bg-white/15 text-xs font-bold text-white">
                    {(identity?.firstName?.[0] ?? "") + (identity?.lastName?.[0] ?? "") || "•"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isRtl ? "left" : "right"}
              align="end"
              sideOffset={12}
              className="w-60 rounded-lg border bg-popover p-1.5 shadow-lg"
            >
              {identityRow}
              <DropdownMenuSeparator />
              {accountLinks.map(({ href, icon: Icon, label, badge }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>
                    <Icon className="opacity-70" aria-hidden />
                    {label}
                    {badge && <span className="ms-auto">{badge}</span>}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="opacity-70" aria-hidden />
                {tAuth("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal" appearance={clerkAppearance}>
            <button
              type="button"
              aria-label={tAuth("signIn")}
              className="mx-auto flex size-9 items-center justify-center rounded-full bg-white/10 text-white ring-2 ring-white/20 transition-colors hover:bg-white/15 hover:ring-white/40"
            >
              <LogIn className="size-4" aria-hidden />
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </>
  );
}
