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
} from "lucide-react"
import Logo from "@/components/logo"
import { usePathname } from "@/i18n/navigation"
import { SearchTrigger } from "@/components/search-dialog"

import { useClerkUser } from "@/hooks/use-clerk-user";
import { useLocale, useTranslations } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { cn } from "@/lib/utils"

import { FEATURES } from "@/lib/features"
import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { StaffNav } from "@/components/staff-nav"
import { AuthNavUser } from "@/components/auth-nav-user"
import { LanguageSwitcher } from "@/components/language-switcher"
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
    const data = React.useMemo(() => ({
        discover: [
            {
                title: t('atlasExplore'),
                url: "/atlas",
                icon: Compass,
                isActive: isLinkActive("/atlas"),
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
                title: t('newsUpdates'),
                url: "/news",
                icon: Newspaper,
                isActive: isLinkActive("/news"),
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
        ],
        collaborate: [
            {
                title: t('regionalCommunities'),
                url: "#",
                icon: Globe,
                isActive: openAccordion === 'regional',
                items: regionalCommunities.map((s) => ({ ...s, isActive: isLinkActive(s.url) })),
                onToggle: () => setOpenAccordion(openAccordion === 'regional' ? null : 'regional')
            },
            {
                title: t('findPeople'),
                url: "/collaborate",
                icon: Users,
                isActive: isLinkActive("/collaborate"),
            },
            // Action item: start or find a project. When engagement is on this
            // routes into Workspaces; otherwise it points at people-discovery so
            // the affordance is never a dead end.
            {
                title: t('startOrFindProject'),
                url: FEATURES.engagement ? "/collaborations" : "/collaborate",
                icon: FolderPlus,
                isActive: FEATURES.engagement
                    ? isLinkActive("/collaborations")
                    : false,
                isAction: true,
            },
        ],
        navSecondary,
        user: userData
    }), [navSecondary, userData, t, openAccordion, researchActionItems, regionalCommunities, isLinkActive]);

    return (
        <Sidebar
            variant="inset"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="xl"
                            asChild
                            className="justify-center p-4 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent data-[active=true]:bg-transparent"
                        >
                            <Logo size="xl" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Universal search — a labelled pill that opens an accessible
                    search modal (keyboard: ⌘K / "/"; focus-trapped; RTL-aware). */}
                <div className="p-2">
                    <SearchTrigger variant="pill" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain
                    items={data.discover}
                    label={t('discover')}
                    openAccordion={openAccordion}
                    setOpenAccordionAction={setOpenAccordion}
                />
                <NavMain
                    items={data.collaborate}
                    label={t('collaborateGroup')}
                    openAccordion={openAccordion}
                    setOpenAccordionAction={setOpenAccordion}
                />
                <StaffNav />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <div className="flex flex-col p-2 gap-2">
                    <AuthNavUser isRTL={isRTL} />
                    <LanguageSwitcher />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
