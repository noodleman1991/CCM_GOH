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

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ isStaff: boolean }>);

/** Staff-only sidebar group (Moderation + Broadcast). Hidden for non-staff. */
export function StaffNav() {
  const t = useTranslations("navigation");
  const { data } = useSWR("/api/me/role", fetcher, { revalidateOnFocus: false });
  if (!data?.isStaff) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("staff")}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/moderation">
              <ShieldAlert />
              <span>{t("moderation")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/moderation/broadcast">
              <Megaphone />
              <span>{t("broadcast")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
