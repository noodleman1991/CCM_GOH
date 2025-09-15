// "use client"
//
// import * as React from "react"
// import {
//     BookOpen,
//     Bot,
//     Frame,
//     LifeBuoy,
//     Map,
//     PieChart,
//     Send,
//     Settings2,
//     SquareTerminal,
// } from "lucide-react"
// import Logo from "@/components/logo"
//
// import { useClerkUser } from "@/hooks/use-clerk-user";
// import { useLocale } from "next-intl"
// import { rtlLocales } from "@/i18n/routing"
// import { cn } from "@/lib/utils"
//
// import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
// import { NavSecondary } from "@/components/nav-secondary"
// import { AuthNavUser } from "@/components/auth-nav-user"
// import { LanguageSwitcher } from "@/components/language-switcher"
// import {
//     Sidebar,
//     SidebarContent,
//     SidebarFooter,
//     SidebarHeader,
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
// } from "@/components/ui/sidebar"
//
// const baseData = {
//     navMain: [
//         {
//             title: "Playground",
//             url: "#",
//             icon: SquareTerminal,
//             isActive: true,
//             items: [
//                 {
//                     title: "History",
//                     url: "#",
//                 },
//                 {
//                     title: "Starred",
//                     url: "#",
//                 },
//                 {
//                     title: "Settings",
//                     url: "#",
//                 },
//             ],
//         },
//         {
//             title: "Models",
//             url: "#",
//             icon: Bot,
//             items: [
//                 {
//                     title: "Genesis",
//                     url: "#",
//                 },
//                 {
//                     title: "Explorer",
//                     url: "#",
//                 },
//                 {
//                     title: "Quantum",
//                     url: "#",
//                 },
//             ],
//         },
//         {
//             title: "Documentation",
//             url: "#",
//             icon: BookOpen,
//             items: [
//                 {
//                     title: "Introduction",
//                     url: "#",
//                 },
//                 {
//                     title: "Get Started",
//                     url: "#",
//                 },
//                 {
//                     title: "Tutorials",
//                     url: "#",
//                 },
//                 {
//                     title: "Changelog",
//                     url: "#",
//                 },
//             ],
//         },
//         {
//             title: "Settings",
//             url: "#",
//             icon: Settings2,
//             items: [
//                 {
//                     title: "General",
//                     url: "#",
//                 },
//                 {
//                     title: "Team",
//                     url: "#",
//                 },
//                 {
//                     title: "Billing",
//                     url: "#",
//                 },
//                 {
//                     title: "Limits",
//                     url: "#",
//                 },
//             ],
//         },
//     ],
//     navSecondary: [
//         {
//             title: "Support",
//             url: "#",
//             icon: LifeBuoy,
//         },
//         {
//             title: "Feedback",
//             url: "#",
//             icon: Send,
//         },
//     ],
//     projects: [
//         {
//             name: "Design Engineering",
//             url: "#",
//             icon: Frame,
//         },
//         {
//             name: "Sales & Marketing",
//             url: "#",
//             icon: PieChart,
//         },
//         {
//             name: "Travel",
//             url: "#",
//             icon: Map,
//         },
//     ],
// }
//
// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//     const { userData, isLoaded } = useClerkUser();
//     const locale = useLocale()
//     const isRTL = rtlLocales.includes(locale)
//
//
//     const data = React.useMemo(() => ({
//         ...baseData,
//         user: userData
//     }), [userData]);
//
//     return (
//         <Sidebar
//             variant="inset"
//             className={cn(isRTL && "rtl-sidebar")}
//             {...props}
//         >
//             <SidebarHeader>
//                 <SidebarMenu>
//                     <SidebarMenuItem>
//                         <SidebarMenuButton size="xl" asChild>
//                             <a href="#">
//                                 {/*<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">*/}
//                                 {/*    <Command className="size-4" />*/}
//                                 {/*</div>*/}
//                                 {/*<div className={cn(*/}
//                                 {/*    "grid flex-1 text-sm leading-tight",*/}
//                                 {/*    isRTL ? "text-right" : "text-left"*/}
//                                 {/*)}>*/}
//                                 {/*    <span className="truncate font-medium">Conne</span>*/}
//                                 {/*    <span className="truncate text-xs">Enterprise</span>*/}
//                                 {/*</div>*/}
//                                 <Logo size="xl" />
//                             </a>
//                         </SidebarMenuButton>
//                     </SidebarMenuItem>
//                 </SidebarMenu>
//             </SidebarHeader>
//             <SidebarContent>
//                 <NavMain items={data.navMain} />
//                 <NavProjects projects={data.projects} />
//                 <NavSecondary items={data.navSecondary} className="mt-auto" />
//             </SidebarContent>
//             <SidebarFooter>
//                 <div className={cn(
//                     "flex-col items-center p-2 gap-2",
//                     isRTL ? "flex-row-reverse" : "flex-row"
//                 )}>
//                     <AuthNavUser isRTL={isRTL} />
//                     <LanguageSwitcher />
//                 </div>
//             </SidebarFooter>
//         </Sidebar>
//     )
// }
//
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
    Building2,
    GraduationCap,
    Stethoscope,
    Leaf,
    Brain,
    Heart,
    Search,
    Languages
} from "lucide-react"
import Logo from "@/components/logo"
import { useRouter } from "next/navigation"

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
    const [openAccordion, setOpenAccordion] = React.useState<string | null>('research')

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
            url: "/outputs",
            icon: FileText,
        },
        {
            title: t('globalAgenda'),
            url: "/global-agenda",
            icon: Globe,
        },
        {
            title: t('regionalAgendas'),
            url: "/regional-agendas",
            icon: MapPin,
        },
        {
            title: t('communityAgendas'),
            url: "/community-agendas",
            icon: Users,
        },
        {
            title: t('caseStudies'),
            url: "/case-studies",
            icon: BookOpen,
        },
        {
            title: t('toolkits'),
            url: "/toolkits",
            icon: Lightbulb,
        },
        {
            title: t('impactReports'),
            url: "/impact-reports",
            icon: BarChart3,
        },
    ];

    // Regional Communities items (no icons, good overflow handling)
    const regionalCommunities = [
        {
            title: t('regions.subSaharanAfrica'),
            url: "/communities/sub-saharan-africa",
        },
        {
            title: t('regions.northernAfricaWesternAsia'),
            url: "/communities/northern-africa-western-asia",
        },
        {
            title: t('regions.centralSouthernAsia'),
            url: "/communities/central-southern-asia",
        },
        {
            title: t('regions.easternSouthEasternAsia'),
            url: "/communities/eastern-south-eastern-asia",
        },
        {
            title: t('regions.latinAmericaCaribbean'),
            url: "/communities/latin-america-caribbean",
        },
        {
            title: t('regions.oceania'),
            url: "/communities/oceania",
        },
        {
            title: t('regions.europeNorthAmerica'),
            url: "/communities/europe-north-america",
        },
    ];

    const navMain = [
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
            icon: MessageSquare,
        },
        {
            title: t('news'),
            url: "/news",
            icon: Newspaper,
        },
    ];

    const navSecondary = [
        {
            title: t('about'),
            url: "/about",
            icon: Building2,
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
        navMain,
        navSecondary,
        // projects,
        user: userData
    }), [navMain, navSecondary, userData]);

    return (
        <Sidebar
            variant="inset"
            className={cn(isRTL && "rtl-sidebar")}
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="xl" asChild>
                            <Logo size="xl" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Search Box */}
                <div className="p-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className={cn(
                            "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 select-none text-slate-900",
                            isRTL ? "right-2" : "left-2"
                        )} />
                        <SidebarInput
                            id="search"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full text-slate-900 placeholder:text-slate-500 bg-white border-gray-300",
                                isRTL ? "pr-8" : "pl-8"
                            )}
                            style={{ color: '#0f172a' }}
                        />
                    </form>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} openAccordion={openAccordion} setOpenAccordion={setOpenAccordion} />
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
