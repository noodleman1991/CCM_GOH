"use client"

import {
    BadgeCheck,
    ChevronsUpDown,
    LogOut,
} from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useState } from "react"

export function NavUser({
                            user,
                            renderLogout,
                        }: {
    user: {
        name: string
        email: string
        avatar: string
    }
    renderLogout?: (closeMenu?: () => void) => React.ReactNode
}) {
    const { isMobile } = useSidebar()
    const [open, setOpen] = useState(false)
    const t = useTranslations("navUser")
    const locale = useLocale()
    const isRTL = rtlLocales.includes(locale)

    const closeMenu = () => setOpen(false)

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn("grid flex-1 text-sm leading-tight", isRTL ? "text-right" : "text-left")}>
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronsUpDown className={cn("size-4", isRTL ? "mr-auto" : "ml-auto")} />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : (isRTL ? "left" : "right")}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className={cn("flex items-center gap-2 px-1 py-1.5 text-sm", isRTL ? "flex-row-reverse text-right" : "text-left")}>
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={cn("grid flex-1 text-sm leading-tight", isRTL ? "text-right" : "text-left")}>
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href={`/${locale}/dashboard`} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                    <BadgeCheck className="size-4" />
                                    <span>{t("account")}</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        {renderLogout ? (
                            renderLogout(closeMenu)
                        ) : (
                            <DropdownMenuItem className={cn(isRTL && "flex-row-reverse")}>
                                <LogOut className="size-4" />
                                <span>{t("logout")}</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
