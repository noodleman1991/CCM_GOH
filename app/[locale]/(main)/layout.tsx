import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { rtlLocales } from '@/i18n/routing';
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";
import { Suspense } from "react";
import { SiteAnnouncementBar } from "@/components/announcement/site-announcement-bar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { FEATURES } from "@/lib/features";

export default async function MainLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const resolvedParams = await params;
    const { locale } = resolvedParams;
    const isRtl = rtlLocales.includes(locale);

    return (
        <SidebarProvider isRtl={isRtl}>
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
                <Suspense fallback={null}>
                    <SiteAnnouncementBar locale={locale} />
                </Suspense>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ms-1" />
                        <Separator
                            orientation="vertical"
                            className="h-4 me-2"
                        />
                    </div>
                    <div className="ms-auto flex items-center gap-2 px-4">
                        {FEATURES.engagement && <NotificationBell />}
                    </div>
                </header>
                {/*
                  overflow-x-clip (not -hidden): clips horizontal overflow
                  WITHOUT making this a scroll container, so position: sticky
                  (reader menus / "on this page", profile sidebars) keeps working
                  against the viewport. overflow-x-hidden silently broke sticky.
                */}
                <div className="flex flex-1 flex-col overflow-x-clip w-full">
                    <main>{children}</main>
                </div>
            </SidebarInset>
            <SanityLive />
            {(await draftMode()).isEnabled && (
                <>
                    <DisableDraftMode />
                    <VisualEditing />
                </>
            )}
        </SidebarProvider>
    );
}
