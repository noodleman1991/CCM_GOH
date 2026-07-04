// components/language-switcher.tsx
"use client"

import React, { useCallback, useTransition } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { useIsMobile } from "@/hooks/use-mobile"
import { Check, ChevronDown, Globe, Languages, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "@/components/ui/drawer"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

// Define language options with direction and font info
const languageOptions = [
    { code: "en", name: "English", isRTL: false },
    { code: "es", name: "Español", isRTL: false },
    { code: "fr", name: "Français", isRTL: false },
    { code: "ar", name: "العربية", isRTL: true }
]

// Arabic font style using the CSS variable from next/font/google
const arabicFontStyle = { fontFamily: 'var(--font-tajawal), sans-serif' }

export function LanguageSwitcher() {
    const router = useRouter()
    const pathname = usePathname()
    const currentLocale = useLocale()
    const isMobile = useIsMobile()
    const isRTL = rtlLocales.includes(currentLocale)
    const { isMobile: sidebarIsMobile } = useSidebar()
    const [isPending, startTransition] = useTransition()

    // Find the current language display name
    const currentLanguage = languageOptions.find(lang => lang.code === currentLocale) || languageOptions[0]

    // Handle language change
    const switchLanguage = useCallback((locale: string) => {
         startTransition(() => {
                 router.replace(pathname, { locale })
             })
     }, [router, pathname])

    if (isMobile) {
        return (
            <Drawer>
                {/* Same SidebarMenuButton chrome as the desktop dropdown trigger,
                    so the switcher reads as part of the sidebar footer on every
                    device (was a stray outline button that clashed with it). */}
                <DrawerTrigger asChild>
                    <SidebarMenuButton size="lg" className={cn(isPending && "opacity-70")}>
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
                        <span className="truncate font-bold">{currentLanguage.name}</span>
                        <ChevronDown className="size-4 ms-auto" />
                    </SidebarMenuButton>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="grid gap-4 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Select Language</h3>
                            <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <X className="h-5 w-5" />
                                </Button>
                            </DrawerClose>
                        </div>
                        <div className="grid gap-2">
                            {languageOptions.map(language => (
                                <Button
                                    key={language.code}
                                    variant="ghost"
                                    className="gap-2 justify-start"
                                    dir={language.isRTL ? "rtl" : "ltr"}
                                    onClick={() => switchLanguage(language.code)}
                                    disabled={isPending}
                                >
                                    <Globe className="h-5 w-5" />
                                    <span
                                        dir={language.isRTL ? "rtl" : "ltr"}
                                        style={language.isRTL ? arabicFontStyle : undefined}
                                    >
                                        {language.name}
                                    </span>
                                    {language.code === currentLocale && (
                                        <Check className="h-5 w-5 ms-auto" />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex flex-1 items-center text-sm leading-tight">
                                {isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <span
                                        className="truncate font-bold"
                                        dir={currentLanguage.isRTL ? "rtl" : "ltr"}
                                        style={currentLanguage.isRTL ? arabicFontStyle : undefined}
                                    >
                                        <span className="hidden sm:inline">{currentLanguage.name}</span>
                                        <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
                                    </span>
                                )}
                            </div>
                            <Languages className="size-4 ms-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={sidebarIsMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        {languageOptions.map(language => (
                            <DropdownMenuItem
                                key={language.code}
                                className="flex items-center justify-between cursor-pointer"
                                dir={language.isRTL ? "rtl" : "ltr"}
                                onClick={() => switchLanguage(language.code)}
                                disabled={isPending}
                            >
                                <span
                                    dir={language.isRTL ? "rtl" : "ltr"}
                                    style={language.isRTL ? arabicFontStyle : undefined}
                                >
                                    {language.name}
                                </span>
                                {language.code === currentLocale && <Check className="h-5 w-5" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
