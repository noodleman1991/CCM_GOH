// components/language-switcher.tsx
"use client"

import React, { useCallback } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { useIsMobile } from "@/hooks/use-mobile"
import { Check, ChevronDown, Globe, X } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "@/components/ui/drawer"

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
                                    className="justify-start gap-2"
                                    onClick={() => switchLanguage(language.code)}
                                >
                                    <Globe className="h-5 w-5" />
                                    <span>{language.name}</span>
                                    {language.code === currentLocale && (
                                        <Check className="h-5 w-5 ml-auto" />
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span>{currentLocale.toUpperCase()}</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {languageOptions.map(language => (
                    <DropdownMenuItem
                        key={language.code}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => switchLanguage(language.code)}
                    >
                        <span>{language.name}</span>
                        {language.code === currentLocale && <Check className="h-5 w-5" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
