"use client"
import * as React from "react"
import {
    BookOpen,
    FileText,
    Globe,
    Users,
    MapPin,
    Lightbulb,
    BarChart3,
    MessageSquare,
    Newspaper,
    Info,
    Heart,
    FolderPlus,
    BookMarked,
    Compass,
    Search,
} from "lucide-react"
import Logo from "@/components/logo"
import { Link, usePathname } from "@/i18n/navigation"
import { SearchTrigger } from "@/components/search-dialog"
import { useSearchStore } from "@/stores/search-store"

import { useClerkUser } from "@/hooks/use-clerk-user";
import { useLocale, useTranslations } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { cn } from "@/lib/utils"

import { FEATURES } from "@/lib/features"
import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { StaffNav } from "@/components/staff-nav"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SidebarQuickActions } from "@/components/sidebar-quick-actions"
import { UserMenuCard } from "@/components/user-menu-card"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { userData } = useClerkUser();
    const locale = useLocale()
    const isRTL = rtlLocales.includes(locale)
    const t = useTranslations('navigation')
    const pathname = usePathname()
    const [openAccordion, setOpenAccordion] = React.useState<string | null>(null)

    // A nav link is active when the current route equals it or is nested under it,
    // so detail pages (e.g. /news/[slug]) highlight their parent nav item. "#"
    // accordion triggers are never themselves a route, so they never match here.
    const isLinkActive = React.useCallback(
        (url: string) =>
            url !== "#" && (pathname === url || pathname.startsWith(`${url}/`)),
        [pathname]
    )

    // On a specific workspace (/collaborations/<id>) the workspace owns the
    // screen, so the global rail shrinks to an icon rail instead of fully hiding.
    // Route-derived (recomputed from the live pathname every render) → it can
    // never leak to other routes; leaving the route flips it back to offcanvas.
    const isWorkspaceRoute = /^\/collaborations\/[^/]+$/.test(pathname)
    const collapsible = isWorkspaceRoute ? "icon" : "offcanvas"

    // Research & Action items
    const researchActionItems = [
        {
            title: t('allOutputs'),
            url: "/research-and-action/all-outputs",
            icon: FileText,
        },
        {
            title: t('globalAgenda'),
            url: "/research-and-action/global-agenda",
            icon: Globe,
        },
        {
            title: t('regionalAgendas'),
            url: "/research-and-action/regional-agendas",
            icon: MapPin,
        },
        {
            title: t('communityAgendas'),
            url: "/research-and-action/community-agendas",
            icon: Users,
        },
        {
            title: t('toolkits'),
            url: "/research-and-action/toolkits",
            icon: Lightbulb,
        },
        {
            title: t('impactReports'),
            url: "/research-and-action/impact-reports",
            icon: BarChart3,
        },
    ];

    // Regional Communities items (no icons, good overflow handling)
    // URLs match exact slugs in Sanity to prevent 404s
    const regionalCommunities = [
        {
            title: t('regions.subSaharanAfrica'),
            url: "/communities/sub-saharan-africa",
        },
        {
            title: t('regions.northernAfricaWesternAsia'),
            url: "/communities/northern-africa-and-western-asia",
        },
        {
            title: t('regions.centralSouthernAsia'),
            url: "/communities/central-and-southern-asia",
        },
        {
            title: t('regions.easternSouthEasternAsia'),
            url: "/communities/eastern-and-south-eastern-asia",
        },
        {
            title: t('regions.latinAmericaCaribbean'),
            url: "/communities/latin-america-and-the-caribbean",
        },
        {
            title: t('regions.oceania'),
            url: "/communities/oceania",
        },
        {
            title: t('regions.europeNorthAmerica'),
            url: "/communities/europe-and-northern-america",
        },
    ];


    const navSecondary = [
        {
            title: t('about'),
            url: "/about",
            icon: Info,
        },
        {
            title: t('feedback'),
            url: "/feedback",
            icon: MessageSquare,
        },
    ];

    // Projects section commented out as requested
    // const projects = [
    //     {
    //         name: t('specialGroups.youth'),
    //         url: "/communities/youth",
    //         icon: GraduationCap,
    //     },
    //     {
    //         name: t('specialGroups.indigenous'),
    //         url: "/communities/indigenous",
    //         icon: Users,
    //     },
    //     {
    //         name: t('specialGroups.smallholderFarmers'),
    //         url: "/communities/smallholder-farmers",
    //         icon: Leaf,
    //     },
    // ];

    // Two-group nav. DISCOVER = find content/knowledge; COLLABORATE = find &
    // work with people and communities. Workspaces only appears when the
    // engagement flag is on. (Atlas joins Discover in Phase 3 once its route exists.)
    // ONE flat menu, no group labels (user direction 2026-07-05) — order:
    // Regional Communities · Atlas · Research & Action · Lived experiences ·
    // Case studies · News. Doorway tiles above carry people/project actions.
    const data = React.useMemo(() => ({
        main: [
            {
                title: t('regionalCommunities'),
                url: "#",
                icon: Globe,
                isActive: openAccordion === 'regional',
                items: regionalCommunities.map((s) => ({ ...s, isActive: isLinkActive(s.url) })),
                onToggle: () => setOpenAccordion(openAccordion === 'regional' ? null : 'regional')
            },
            {
                title: t('researchAction'),
                url: "#",
                icon: BookOpen,
                isActive: openAccordion === 'research',
                items: researchActionItems.map((s) => ({ ...s, isActive: isLinkActive(s.url) })),
                onToggle: () => setOpenAccordion(openAccordion === 'research' ? null : 'research')
            },
            {
                title: t('atlas'),
                url: "/atlas",
                icon: Compass,
                isActive: isLinkActive("/atlas"),
            },
            {
                title: t('livedExperiences'),
                url: "/lived-experiences",
                icon: Heart,
                isActive: isLinkActive("/lived-experiences"),
            },
            {
                title: t('caseStudies'),
                url: "/research-and-action/case-studies",
                icon: BookMarked,
                isActive: isLinkActive("/research-and-action/case-studies"),
            },
            {
                title: t('newsUpdates'),
                url: "/news",
                icon: Newspaper,
                isActive: isLinkActive("/news"),
            },
        ],
        navSecondary,
        user: userData
    }), [navSecondary, userData, t, openAccordion, researchActionItems, regionalCommunities, isLinkActive]);

    return (
        <Sidebar
            variant="inset"
            collapsible={collapsible}
            {...props}
        >
            <SidebarHeader>
                {/* Brand lockup (sidebar revision 2026-07-05): compact,
                    start-aligned wordmark riding a soft sky blob — the same
                    treatment on desktop and in the mobile sheet. Icon rail
                    swaps to the round "ccm" mark. */}
                <Link
                    href="/"
                    aria-label="Go to homepage"
                    className="flex justify-center px-5 pb-6 pt-6 group-data-[collapsible=icon]:p-2"
                >
                    <span className="block group-data-[collapsible=icon]:hidden [&_img]:h-[4.25rem] [&_img]:w-auto">
                        <Logo size="lg" asChild />
                    </span>
                    <span
                        aria-hidden
                        className="hidden size-8 items-center justify-center rounded-full bg-white font-heading text-[11px] font-bold lowercase tracking-tight text-ccm-midnight group-data-[collapsible=icon]:flex"
                    >
                        ccm
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarQuickActions />
            <SidebarContent>
                <NavMain
                    items={data.main}
                    openAccordion={openAccordion}
                    setOpenAccordionAction={setOpenAccordion}
                />
                <StaffNav />
                {/* About · Feedback share one quiet horizontal line. */}
                <div className="mt-auto flex items-center gap-1 px-3 pb-1 group-data-[collapsible=icon]:hidden">
                    {data.navSecondary.map((item) => (
                        <Link
                            key={item.url}
                            href={item.url}
                            className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/8 hover:text-sidebar-foreground"
                        >
                            <item.icon className="size-3.5 opacity-70" aria-hidden />
                            {item.title}
                        </Link>
                    ))}
                </div>
            </SidebarContent>
            <SidebarFooter>
                <UserMenuCard />
                {/* Search moved to the quick-actions row (sidebar revision
                    2026-07-05) — the footer keeps only the icon-rail variant
                    for collapsed workspace routes. */}
                <SidebarMenu className="hidden group-data-[collapsible=icon]:block">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip={t('searchPlaceholder')}
                            onClick={() => useSearchStore.getState().setOpen(true)}
                            className="justify-center"
                        >
                            <Search />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {/* The wide language switcher can't fit the icon rail; hide it
                    there (it's one click away once the rail is expanded). */}
                <div className="p-2 pt-0 group-data-[collapsible=icon]:hidden">
                    <LanguageSwitcher />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
