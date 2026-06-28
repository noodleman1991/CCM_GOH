"use client"

import { SignInButton, SignUpButton, SignedIn, SignedOut, useClerk } from '@clerk/nextjs'
import { LogOut } from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { cn } from "@/lib/utils"
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { clerkAppearance } from "@/lib/clerk-appearance"

export function AuthNavUser({ isRTL = false }: { isRTL?: boolean }) {
    const t = useTranslations('auth')
    const { userData } = useClerkUser()
    const { signOut } = useClerk()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Prevent hydration mismatch by showing consistent loading state on server
    if (!mounted) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size="lg"
                        className={cn(
                            "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                            isRTL && "flex-row-reverse"
                        )}
                        disabled
                    >
                        <div className={cn(
                            "grid flex-1 text-sm leading-tight",
                            isRTL ? "text-right" : "text-left"
                        )}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    return (
        <>
            <SignedIn>
                <NavUser
                    user={userData}
                    //isRTL={isRTL}
                    renderLogoutAction={(closeMenu) => (
                        <DropdownMenuItem
                            onClick={() => {
                                closeMenu?.()
                                signOut()
                            }}
                            className={cn(isRTL && "flex-row-reverse text-right")}
                        >
                            <LogOut className={cn(isRTL && "ml-2 mr-0")} />
                            {t('signOut')}
                        </DropdownMenuItem>
                    )}
                />
            </SignedIn>

            <SignedOut>
                {/* A plain greeting line followed by the two auth actions shown
                    directly — no dropdown/popping menu. Sign in = `outline`,
                    Create account = `default`, matching the modal's buttons. */}
                <div
                    className={cn(
                        "flex flex-col gap-2 px-1 group-data-[collapsible=icon]:hidden",
                        isRTL ? "text-right" : "text-left"
                    )}
                    suppressHydrationWarning
                >
                    <p className="px-1 text-sm font-medium text-sidebar-foreground/80">
                        {t('welcome')}
                    </p>
                    <SignInButton mode="modal" appearance={clerkAppearance}>
                        <Button className="w-full" variant="outline">
                            {t('signIn')}
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal" appearance={clerkAppearance}>
                        <Button className="w-full">
                            {t('createAccount')}
                        </Button>
                    </SignUpButton>
                </div>
            </SignedOut>
        </>
    )
}
