"use client"

import { SignInButton, SignUpButton, SignedIn, SignedOut, useClerk } from '@clerk/nextjs'
import { LogOut } from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { cn } from "@/lib/utils"
import { useEffect, useState } from 'react'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function AuthNavUser({ isRTL = false }: { isRTL?: boolean }) {
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
                    renderLogout={(closeMenu) => (
                        <DropdownMenuItem
                            onClick={() => {
                                closeMenu?.()
                                signOut()
                            }}
                            className={cn(isRTL && "flex-row-reverse text-right")}
                        >
                            <LogOut className={cn(isRTL && "ml-2 mr-0")} />
                            Sign out
                        </DropdownMenuItem>
                    )}
                />
            </SignedIn>

            <SignedOut>
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
                                        "grid flex-1 text-sm leading-tight",
                                        isRTL ? "text-right" : "text-left"
                                    )}>
                                        <span className="truncate font-medium">Welcome</span>
                                        <span className="truncate text-xs">Sign in to get started</span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="min-w-56 rounded-lg"
                                align={isRTL ? "start" : "end"}
                                side={isRTL ? "left" : "right"}
                                sideOffset={4}
                            >
                                <div className="flex flex-col gap-2 p-2">
                                    <SignInButton mode="modal">
                                        <Button
                                            className={cn(
                                                "w-full",
                                                isRTL ? "justify-end" : "justify-start"
                                            )}
                                            variant="outline"
                                        >
                                            Sign In
                                        </Button>
                                    </SignInButton>

                                    <DropdownMenuSeparator />

                                    <SignUpButton mode="modal">
                                        <Button
                                            className={cn(
                                                "w-full",
                                                isRTL ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            Create account
                                        </Button>
                                    </SignUpButton>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SignedOut>
        </>
    )
}
