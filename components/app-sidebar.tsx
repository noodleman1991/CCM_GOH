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
    Search,
    Handshake,
    X,
} from "lucide-react"
import Logo from "@/components/logo"
import { useRouter } from "@/i18n/navigation"

import { useClerkUser } from "@/hooks/use-clerk-user";
import { useLocale, useTranslations } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { cn } from "@/lib/utils"

import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
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
    SidebarInput
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { userData } = useClerkUser();
    const locale = useLocale()
    const isRTL = rtlLocales.includes(locale)
    const t = useTranslations('navigation')
    const router = useRouter()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [openAccordion, setOpenAccordion] = React.useState<string | null>(null)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

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
            title: t('caseStudies'),
            url: "/research-and-action/case-studies",
            icon: BookOpen,
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

    const data = React.useMemo(() => ({
        navMain: [
            {
                title: t('researchAction'),
                url: "#",
                icon: BookOpen,
                isActive: openAccordion === 'research',
                items: researchActionItems,
                onToggle: () => setOpenAccordion(openAccordion === 'research' ? null : 'research')
            },
            {
                title: t('livedExperiences'),
                url: "/lived-experiences",
                icon: Heart,
            },
            {
                title: t('regionalCommunities'),
                url: "#",
                icon: Globe,
                isActive: openAccordion === 'regional',
                items: regionalCommunities,
                onToggle: () => setOpenAccordion(openAccordion === 'regional' ? null : 'regional')
            },
            {
                title: t('collaborate'),
                url: "/collaborate",
                icon: Handshake,
            },
            {
                title: t('news'),
                url: "/news",
                icon: Newspaper,
            },
        ],
        navSecondary,
        user: userData
    }), [navSecondary, userData, t, openAccordion, researchActionItems, regionalCommunities]);

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

                {/* Search Box */}
                <div className="p-2">
                    <form onSubmit={handleSearch} className="relative sidebar-search-input">
                        <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 select-none text-slate-900 start-2" />
                        <SidebarInput
                            id="search"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full placeholder:text-slate-500 bg-background border-gray-300 text-slate-900 ps-8 pe-8"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 end-2"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} openAccordion={openAccordion} setOpenAccordionAction={setOpenAccordion} />
                {/* <NavProjects projects={data.projects} /> */}
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
