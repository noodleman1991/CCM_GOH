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
                        <div className="grid flex-1 text-sm leading-tight text-start">
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
                            className={cn("text-start", isRTL && "flex-row-reverse")}
                        >
                            <LogOut className={cn(isRTL && "ms-0 me-2")} />
                            {t('signOut')}
                        </DropdownMenuItem>
                    )}
                />
            </SignedIn>

            <SignedOut>
                {/* Two auth actions shown directly (no dropdown/popping menu),
                    adapted for the DARK sidebar surface so both read clearly and
                    are distinct from each other and from the search box below:
                    • Create account = solid WHITE button (the primary CTA), using
                      the sidebar's primary tokens (white bg / midnight text).
                    • Sign in = transparent button with a white hairline border +
                      white text (secondary), using the sidebar border token.
                    Radius is unified to rounded-lg — the repo's Button radius
                    (var(--radius)) — across both buttons and the search box. */}
                <div
                    className={cn(
                        "flex flex-col gap-2 px-1 group-data-[collapsible=icon]:hidden text-start"
                    )}
                    suppressHydrationWarning
                >
                    <SignUpButton mode="modal" appearance={clerkAppearance}>
                        <Button className="w-full rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                            {t('createAccount')}
                        </Button>
                    </SignUpButton>
                    <SignInButton mode="modal" appearance={clerkAppearance}>
                        <Button className="w-full rounded-lg border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            {t('signIn')}
                        </Button>
                    </SignInButton>
                </div>
            </SignedOut>
        </>
    )
}
