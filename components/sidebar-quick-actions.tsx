"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { FolderPlus, Search, UsersRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Sidebar quick actions (user revision 2026-07-05): the three doorways —
 * Search · Find people · Start a project — identical on the desktop rail and
 * the mobile sheet (one component, one design). Auth-aware: signed-out users
 * are routed to sign-in with a redirect back to their destination instead of
 * bouncing off a gated page.
 */
export function SidebarQuickActions() {
  const t = useTranslations("navigation");
  const { setOpenMobile } = useSidebar();
  const { isSignedIn } = useUser();

  const gate = (target: string) => (isSignedIn ? target : `/sign-in?redirect=${encodeURIComponent(target)}`);
  const close = () => setOpenMobile(false);

  const item =
    "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-1 text-center text-[10.5px] font-bold leading-tight text-white transition-colors hover:bg-white/15 active:bg-white/20 group-data-[collapsible=icon]:hidden";

  return (
    <div className="mb-2 flex gap-1.5 px-2.5 group-data-[collapsible=icon]:hidden">
      <button
        type="button"
        className={item}
        onClick={() => {
          close();
          useSearchStore.getState().setOpen(true);
        }}
      >
        <Search className="size-4" aria-hidden />
        {t("quickSearch")}
      </button>
      <Link href={gate("/collaborate?tab=people")} className={item} onClick={close}>
        <UsersRound className="size-4" aria-hidden />
        {t("quickFindPeople")}
      </Link>
      <Link href={gate("/collaborations")} className={item} onClick={close}>
        <FolderPlus className="size-4" aria-hidden />
        {t("quickStartProject")}
      </Link>
    </div>
  );
}
