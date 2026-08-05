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
import { SearchModal } from "@/components/search-dialog";
import { getActor, isStaff } from "@/lib/authz";
import { ReportIssueWidget } from "@/components/issue-report/report-issue-widget";

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
    // The issue reporter is staff-only (team_editor | admin) — same gate as the
    // moderation queue. Nobody else gets the widget in their DOM at all.
    const canReportIssues = isStaff(await getActor());

    return (
        <SidebarProvider isRtl={isRtl}>
            <AppSidebar />
            {/* overflow-x-clip, NOT -hidden: hidden makes the inset a scroll
                container, which silently breaks every position:sticky inside
                (region-page spine, reader menus). clip keeps the horizontal
                clipping without creating a scrollport. */}
            <SidebarInset className="overflow-x-clip">
                <Suspense fallback={null}>
                    <SiteAnnouncementBar locale={locale} />
                </Suspense>
                <header className="relative z-20 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ms-1" />
                        <Separator
                            orientation="vertical"
                            className="h-4 me-2"
                        />
                    </div>
                </header>
                {/*
                  overflow-x-clip (not -hidden): clips horizontal overflow
                  WITHOUT making this a scroll container, so position: sticky
                  (reader menus / "on this page", profile sidebars) keeps working
                  against the viewport. overflow-x-hidden silently broke sticky.
                */}
                {/* SidebarInset already renders the page's <main> landmark —
                    a nested second <main> here was an axe duplicate-landmark
                    violation. Plain div keeps the layout role-free. */}
                {/* @container/page makes this the measuring stick for every
                    block's responsive steps. Breakpoints must key off the width
                    content ACTUALLY gets, not the viewport: with the sidebar open
                    the panel is ~282px narrower, so viewport-keyed `lg:`/`xl:`
                    classes fired one step too dense (a 4-up grid at 1440 got
                    261px columns). Container queries make the same page respond
                    correctly in both the expanded and collapsed sidebar states.
                    Safe to make a containment context here: every position:fixed
                    element (cookie banner, issue widget, draft-mode toggle) is
                    mounted in the root [locale] layout, outside this subtree. */}
                <div className="@container/page flex flex-1 flex-col overflow-x-clip w-full">
                    <div>{children}</div>
                </div>
            </SidebarInset>
            {/* Single universal-search modal — opened by any SearchTrigger or the
                ⌘K / "/" shortcut (one instance, no stacking). */}
            <SearchModal />
            {canReportIssues && <ReportIssueWidget />}
            {/* Kill-switch for API-quota outages: when the live-events stream
                can't connect (e.g. 402 plan_limit_reached) next-sanity retries
                every ~1s with no backoff, burning quota and churning re-renders.
                sanityFetch keeps working either way (revalidate cap in live.ts). */}
            {process.env.SANITY_LIVE_DISABLED !== "true" && <SanityLive />}
            {(await draftMode()).isEnabled && (
                <>
                    <DisableDraftMode />
                    <VisualEditing />
                </>
            )}
        </SidebarProvider>
    );
}
