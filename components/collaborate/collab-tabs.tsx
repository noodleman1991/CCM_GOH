"use client";

import { type ReactNode, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_VALUES = ["projects", "people", "events"] as const;
type TabValue = (typeof TAB_VALUES)[number];

/** Collaborate-space shell (§4.6): Projects · People · Events, URL-synced via
 *  ?tab= so each tab deep-links. Panels are server-rendered and passed in. */
export function CollabTabs({
  projects,
  people,
  events,
}: {
  projects: ReactNode;
  people: ReactNode;
  events: ReactNode;
}) {
  const t = useTranslations("collabSpace");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get("tab");
  const active: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : "projects";

  const onChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <Tabs value={active} onValueChange={onChange} className="space-y-6">
      <TabsList className="h-auto">
        <TabsTrigger value="projects" className="min-h-[44px] px-4">
          {t("projectsTab")}
        </TabsTrigger>
        <TabsTrigger value="people" className="min-h-[44px] px-4">
          {t("peopleTab")}
        </TabsTrigger>
        <TabsTrigger value="events" className="min-h-[44px] px-4">
          {t("eventsTab")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="projects">{projects}</TabsContent>
      <TabsContent value="people">{people}</TabsContent>
      <TabsContent value="events">{events}</TabsContent>
    </Tabs>
  );
}
