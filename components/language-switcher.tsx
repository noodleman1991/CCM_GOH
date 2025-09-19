// components/language-switcher.tsx
"use client"

import React, { useCallback } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { useIsMobile } from "@/hooks/use-mobile"
import { Check, ChevronDown, ChevronsUpDown, Globe, Languages, X } from "lucide-react"
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

// Define language options with direction info
const languageOptions = [
    { code: "en", name: "English", isRTL: false },
    { code: "es", name: "Español", isRTL: false },
    { code: "fr", name: "Français", isRTL: false },
    { code: "ar", name: "العربية", isRTL: true }
]

export function LanguageSwitcher() {
    const router = useRouter()
    const pathname = usePathname()
    const currentLocale = useLocale()
    const isMobile = useIsMobile()
    const isRTL = rtlLocales.includes(currentLocale)
    const { isMobile: sidebarIsMobile } = useSidebar()

    // Find the current language display name
    const currentLanguage = languageOptions.find(lang => lang.code === currentLocale) || languageOptions[0]

    // Handle language change
    const switchLanguage = useCallback((locale: string) => {
        router.push(pathname, { locale })
    }, [router, pathname])

    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        <span>{currentLocale.toUpperCase()}</span>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
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
                                    className={cn(
                                        "gap-2",
                                        language.isRTL ? "justify-end flex-row-reverse" : "justify-start"
                                    )}
                                    onClick={() => switchLanguage(language.code)}
                                >
                                    <Globe className="h-5 w-5" />
                                    <span className={cn(
                                        language.isRTL && "text-right"
                                    )} dir={language.isRTL ? "rtl" : "ltr"}>
                                        {language.name}
                                    </span>
                                    {language.code === currentLocale && (
                                        <Check className={cn(
                                            "h-5 w-5",
                                            language.isRTL ? "mr-auto" : "ml-auto"
                                        )} />
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
                            className={cn(
                                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                isRTL && "flex-row-reverse"
                            )}
                        >
                            <div className={cn(
                                "flex flex-1 items-center text-sm leading-tight",
                                currentLanguage.isRTL ? "text-right justify-end" : "text-left"
                            )}>
                                <span
                                    className="truncate"
                                    style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                                    dir={currentLanguage.isRTL ? "rtl" : "ltr"}
                                >
                                    <span className="hidden sm:inline">{currentLanguage.name}</span>
                                    <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
                                </span>
                            </div>
                            <Languages className={cn(
                                "size-4",
                                currentLanguage.isRTL ? "mr-auto" : "ml-auto"
                            )} />
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
                                className={cn(
                                    "flex items-center justify-between cursor-pointer",
                                    language.isRTL && "flex-row-reverse text-right"
                                )}
                                onClick={() => switchLanguage(language.code)}
                            >
                                <span className={cn(
                                    language.isRTL && "text-right"
                                )} dir={language.isRTL ? "rtl" : "ltr"}>
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
