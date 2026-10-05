"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShieldAlert, Megaphone } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCollaboration } from "@/hooks/use-collaboration";
import { jsonFetcher } from "@/lib/swr";


/** Staff-only sidebar group (Moderation + Broadcast). Hidden for non-staff. */
export function StaffNav() {
  const t = useTranslations("navigation");
  const access = useCollaboration();
  const { data } = useSWR<{ isStaff: boolean; reviewCount?: number }>("/api/me/role", jsonFetcher, { revalidateOnFocus: false });
  if (!data?.isStaff) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("staff")}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={t("moderation")}>
            <Link href="/moderation">
              <ShieldAlert />
              {/* Collapsed rail: hide the label outright so the icon alone
                  centers cleanly (see nav-main.tsx for why truncate/shrink
                  alone isn't reliable here). */}
              <span className="group-data-[collapsible=icon]:hidden">{t("moderation")}</span>
              {data.reviewCount ? (
                <span className="ms-auto rounded-full bg-ccm-gold px-1.5 text-xs font-bold text-ccm-midnight group-data-[collapsible=icon]:hidden">
                  {data.reviewCount}
                </span>
              ) : null}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {access.notifications && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("broadcast")}>
              <Link href="/moderation/broadcast">
                <Megaphone />
                <span className="group-data-[collapsible=icon]:hidden">{t("broadcast")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
