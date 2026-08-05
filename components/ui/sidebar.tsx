"use client"
import { useTranslations } from "next-intl"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { MenuIcon, PanelLeftIcon, PanelRightIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "next-intl"
import { rtlLocales } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "17.625rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
    state: "expanded" | "collapsed"
    open: boolean
    setOpen: (open: boolean) => void
    openMobile: boolean
    setOpenMobile: (open: boolean) => void
    isMobile: boolean
    toggleSidebar: () => void
    isRtl: boolean
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
    const context = React.useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.")
    }

    return context
}

function SidebarProvider({
                             defaultOpen = true,
                             open: openProp,
                             onOpenChange: setOpenProp,
                             isRtl = false,
                             className,
                             style,
                             children,
                             ...props
                         }: React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    isRtl?: boolean
}) {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // Use the same RTL detection logic as app-sidebar
    const locale = useLocale()
    const detectedRtl = rtlLocales.includes(locale)

    const effectiveIsRtl = isRtl || detectedRtl

    // Apply dir attribute to document when RTL is detected
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.dir = effectiveIsRtl ? 'rtl' : 'ltr'
        }
    }, [effectiveIsRtl])

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
        (value: boolean | ((value: boolean) => boolean)) => {
            const openState = typeof value === "function" ? value(open) : value
            if (setOpenProp) {
                setOpenProp(openState)
            } else {
                _setOpen(openState)
            }

            // This sets the cookie to keep the sidebar state.
            document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        },
        [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
        return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
                (event.metaKey || event.ctrlKey)
            ) {
                event.preventDefault()
                toggleSidebar()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContextProps>(
        () => ({
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar,
            isRtl: effectiveIsRtl,
        }),
        [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, effectiveIsRtl]
    )

    return (
        <SidebarContext.Provider value={contextValue}>
            <TooltipProvider delayDuration={0}>
                <div
                    data-slot="sidebar-wrapper"
                    dir={effectiveIsRtl ? 'rtl' : 'ltr'}
                    style={
                        {
                            "--sidebar-width": SIDEBAR_WIDTH,
                            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                            ...style,
                        } as React.CSSProperties
                    }
                    className={cn(
                        "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
                        className
                    )}
                    {...props}
                >
                    {children}
                </div>
            </TooltipProvider>
        </SidebarContext.Provider>
    )
}

function Sidebar({
                     side,
                     variant = "sidebar",
                     collapsible = "offcanvas",
                     className,
                     children,
                     ...props
                 }: React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
}) {
    const { isMobile, state, openMobile, setOpenMobile, isRtl } = useSidebar()
    const t = useTranslations("common")

    // Auto-determine side based on RTL if not explicitly set
    const effectiveSide = side ?? (isRtl ? "right" : "left")

    if (collapsible === "none") {
        return (
            <div
                data-slot="sidebar"
                className={cn(
                    "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }

    if (isMobile) {
        // Native-feel BOTTOM drawer (vaul): the phone-native sheet pattern —
        // slides up with a grab handle, swipe-down to dismiss, rounded top,
        // safe-area padding. Direction-agnostic, so RTL needs no special case.
        return (
            <Drawer open={openMobile} onOpenChange={setOpenMobile} direction="bottom">
                <DrawerContent
                    data-sidebar="sidebar"
                    data-slot="sidebar"
                    data-mobile="true"
                    className="max-h-[88dvh] rounded-t-2xl border-transparent bg-sidebar text-sidebar-foreground p-0 [&>button]:hidden"
                >
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>{t("mainNavigation")}</DrawerTitle>
                        <DrawerDescription>{t("mainNavigationDescription")}</DrawerDescription>
                    </DrawerHeader>
                    {/* vaul's built-in grab handle renders for bottom drawers. */}
                    <div className="flex w-full flex-col overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),12px)]">
                        {children}
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <div
            className="group peer text-sidebar-foreground hidden md:block"
            data-state={state}
            data-collapsible={state === "collapsed" ? collapsible : ""}
            data-variant={variant}
            data-side={effectiveSide}
            data-slot="sidebar"
        >
            {/* This is what handles the sidebar gap on desktop */}
            <div
                data-slot="sidebar-gap"
                className={cn(
                    "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
                    "group-data-[collapsible=offcanvas]:w-0",
                    // Only `floating` insets its fixed container (adds the
                    // +spacing(4) padding below) — `inset`'s fixed container is
                    // plain w-(--sidebar-width-icon), so including it here left
                    // a ~16px dead gutter in the collapsed workspace rail.
                    variant === "floating"
                        ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                        : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
                )}
            />
            <div
                data-slot="sidebar-container"
                className={cn(
                    // Height: pin top/bottom with inset-y-0 AND set h-dvh. inset-y-0
                    // alone resolves against the *containing block*, so it collapses
                    // if any ancestor establishes one (transform/filter/will-change/
                    // contain) — which silently broke vertical responsiveness. h-dvh
                    // (dynamic viewport height) tracks the viewport without the svh
                    // scroll-flicker, so it stays full-height regardless of ancestors.
                    "fixed inset-y-0 h-dvh z-10 hidden w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
                    // Simple positioning based on effectiveSide
                    effectiveSide === "left"
                        ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
                        : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
                    // Only `floating` insets the panel from the screen edge.
                    // `inset` runs the sidebar flush to the edge so the shell
                    // reads as two solid regions — blue nav, white content —
                    // rather than a card floating inside a blue frame.
                    variant === "floating"
                        ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
                        : cn(
                            "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
                            // No divider for `inset`: the blue panel meets the
                            // white content directly, so a border reads as a seam.
                            variant === "sidebar" &&
                                (effectiveSide === "left" ? "border-r" : "border-l")
                        ),
                    className
                )}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    data-slot="sidebar-inner"
                    className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

function SidebarTrigger({
                            className,
                            onClick,
                            ...props
                        }: React.ComponentProps<typeof Button>) {
    const { toggleSidebar, isRtl, isMobile } = useSidebar()
    const t = useTranslations("common")

    return (
        <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className={cn("size-7", className)}
            onClick={(event) => {
                onClick?.(event)
                toggleSidebar()
            }}
            {...props}
        >
            {/* Mobile opens a bottom sheet, so the affordance is the universal
                menu glyph; desktop keeps the panel icon (it collapses a panel). */}
            {isMobile ? <MenuIcon /> : isRtl ? <PanelRightIcon /> : <PanelLeftIcon />}
            <span className="sr-only">{t("toggleSidebar")}</span>
        </Button>
    )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
    const t = useTranslations("common")
    const { toggleSidebar, isRtl } = useSidebar()

    return (
        <button
            data-sidebar="rail"
            data-slot="sidebar-rail"
            aria-label={t("toggleSidebar")}
            tabIndex={-1}
            onClick={toggleSidebar}
            title={t("toggleSidebar")}
            className={cn(
                "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
                isRtl
                    ? "group-data-[side=right]:-left-4 group-data-[side=left]:right-0"
                    : "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
                "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
                "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
                "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
                isRtl
                    ? "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2 [[data-side=left][data-collapsible=offcanvas]_&]:-right-2"
                    : "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
                className
            )}
            {...props}
        />
    )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
    return (
        <main
            data-slot="sidebar-inset"
            className={cn(
                // min-w-0 is load-bearing: as a flex item this defaults to
                // min-width:auto, which floors the panel at its content's
                // min-content width. Any wide descendant (e.g. a horizontally
                // scrollable chip row whose chips don't shrink) then pins the
                // panel wider than the space left by the sidebar, pushing the
                // page past the viewport and stopping it tracking screen width.
                // min-w-0 lets it shrink to the available space in both the
                // expanded and collapsed sidebar states; wide children scroll or
                // clip inside it instead of blowing out the shell.
                "bg-background relative flex w-full min-w-0 flex-1 flex-col",
                // The content panel is a soft-cornered card inset from the blue
                // shell — the curve on all four corners is the intended look, so
                // it needs the small gap on every side to curve against. (An
                // earlier pass ran it flush to the edges, which squared off the
                // corners; the rounded card reads better.) The sidebar panel
                // itself stays flush to the screen edge — see the container's
                // variant handling above — so the blue still reaches the edge.
                "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
                className
            )}
            {...props}
        />
    )
}

function SidebarInput({
                          className,
                          ...props
                      }: React.ComponentProps<typeof Input>) {
    return (
        <Input
            data-slot="sidebar-input"
            data-sidebar="input"
            className={cn("bg-background h-8 w-full shadow-none text-foreground", className)}
            {...props}
        />
    )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-header"
            data-sidebar="header"
            // shrink-0 so the header keeps its full height and any overflow is
            // pushed into SidebarContent's scroll region rather than squeezing
            // the header/footer (which clipped the avatar + language switcher
            // off the bottom on short/tall viewports when signed in).
            className={cn("flex shrink-0 flex-col gap-2 p-2", className)}
            {...props}
        />
    )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-footer"
            data-sidebar="footer"
            // shrink-0 so the footer (avatar + language switcher) always keeps
            // its full height and stays visible; overflow goes to the scrollable
            // SidebarContent instead of clipping the footer off the viewport.
            className={cn("flex shrink-0 flex-col gap-2 p-2", className)}
            {...props}
        />
    )
}

function SidebarSeparator({
                              className,
                              ...props
                          }: React.ComponentProps<typeof Separator>) {
    return (
        <Separator
            data-slot="sidebar-separator"
            data-sidebar="separator"
            className={cn("bg-sidebar-border mx-2 w-auto", className)}
            {...props}
        />
    )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cn(
                "flex min-h-0 flex-1 flex-col gap-2 overflow-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent group-data-[collapsible=icon]:overflow-hidden",
                className
            )}
            {...props}
        />
    )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-group"
            data-sidebar="group"
            className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
            {...props}
        />
    )
}

function SidebarGroupLabel({
                               className,
                               asChild = false,
                               ...props
                           }: React.ComponentProps<"div"> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "div"

    return (
        <Comp
            data-slot="sidebar-group-label"
            data-sidebar="group-label"
            className={cn(
                "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
                "text-start",
                className
            )}
            {...props}
        />
    )
}

function SidebarGroupAction({
                                className,
                                asChild = false,
                                ...props
                            }: React.ComponentProps<"button"> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="sidebar-group-action"
            data-sidebar="group-action"
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "absolute top-3.5",
                "end-3",
                // Increases the hit area of the button on mobile.
                "after:absolute after:-inset-2 md:after:hidden",
                "group-data-[collapsible=icon]:hidden",
                className
            )}
            {...props}
        />
    )
}

function SidebarGroupContent({
                                 className,
                                 ...props
                             }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-group-content"
            data-sidebar="group-content"
            className={cn(
                "w-full text-sm",
                "text-start",
                className
            )}
            {...props}
        />
    )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
    return (
        <ul
            data-slot="sidebar-menu"
            data-sidebar="menu"
            className={cn("flex w-full min-w-0 flex-col gap-1", className)}
            {...props}
        />
    )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="sidebar-menu-item"
            data-sidebar="menu-item"
            className={cn("group/menu-item relative", className)}
            {...props}
        />
    )
}

const sidebarMenuButtonVariants = cva(
    // group-data-[collapsible=icon]:justify-center + rounded-lg: the collapsed
    // rail forces every button to an exact icon-sized square, but that alone
    // only centers the icon by coincidence (padding math happens to cancel
    // out) — justify-center makes it deliberate and resilient to badges/
    // chevrons/long labels that would otherwise skew it. rounded-lg matches
    // the rail's other icon boxes (search action, user avatar).
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                outline:
                    "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
            },
            size: {
                default: "h-8 text-sm",
                sm: "h-7 text-xs",
                lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
                xl: "h-22 text-base group-data-[collapsible=icon]:p-0!",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function SidebarMenuButton({
                               asChild = false,
                               isActive = false,
                               variant = "default",
                               size = "default",
                               tooltip,
                               className,
                               ...props
                           }: React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state, isRtl } = useSidebar()

    const button = (
        <Comp
            data-slot="sidebar-menu-button"
            data-sidebar="menu-button"
            data-size={size}
            data-active={isActive}
            className={cn(
                sidebarMenuButtonVariants({ variant, size }),
                "text-start group-has-data-[sidebar=menu-action]/menu-item:pe-8",
                // Remove hover for xl variant - following best practices by putting it in component
                size === "xl" && "hover:bg-transparent hover:text-current",
                className
            )}
            {...props}
        />
    )

    if (!tooltip) {
        return button
    }

    if (typeof tooltip === "string") {
        tooltip = {
            children: tooltip,
        }
    }

    // CCM-styled tooltip for the collapsed rail: midnight chip, no arrow, a
    // hair of offset (ms-1 is a logical margin so it stays correct in RTL,
    // where the tooltip flips to the left of the rail).
    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent
                side={isRtl ? "left" : "right"}
                align="center"
                hidden={state !== "collapsed" || isMobile}
                showArrow={false}
                {...tooltip}
                className={cn(
                    "ms-1 border-0 bg-ccm-midnight px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg",
                    tooltip.className
                )}
            />
        </Tooltip>
    )
}

function SidebarMenuAction({
                               className,
                               asChild = false,
                               showOnHover = false,
                               ...props
                           }: React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
}) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="sidebar-menu-action"
            data-sidebar="menu-action"
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "absolute top-1.5",
                "end-1",
                // Increases the hit area of the button on mobile.
                "after:absolute after:-inset-2 md:after:hidden",
                "peer-data-[size=sm]/menu-button:top-1",
                "peer-data-[size=default]/menu-button:top-1.5",
                "peer-data-[size=lg]/menu-button:top-2.5",
                "group-data-[collapsible=icon]:hidden",
                showOnHover &&
                "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
                className
            )}
            {...props}
        />
    )
}

function SidebarMenuBadge({
                              className,
                              ...props
                          }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-menu-badge"
            data-sidebar="menu-badge"
            className={cn(
                "text-sidebar-foreground pointer-events-none flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
                "absolute",
                "end-1",
                "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
                "peer-data-[size=sm]/menu-button:top-1",
                "peer-data-[size=default]/menu-button:top-1.5",
                "peer-data-[size=lg]/menu-button:top-2.5",
                "group-data-[collapsible=icon]:hidden",
                className
            )}
            {...props}
        />
    )
}

function SidebarMenuSkeleton({
                                 className,
                                 showIcon = false,
                                 ...props
                             }: React.ComponentProps<"div"> & {
    showIcon?: boolean
}) {
    const { isRtl } = useSidebar()
    // Random width between 50 to 90%.
    const width = React.useMemo(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`
    }, [])

    return (
        <div
            data-slot="sidebar-menu-skeleton"
            data-sidebar="menu-skeleton"
            className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2",
                isRtl ? "flex-row-reverse" : "flex-row",
                className
            )}
            {...props}
        >
            {showIcon && (
                <Skeleton
                    className="size-4 rounded-md"
                    data-sidebar="menu-skeleton-icon"
                />
            )}
            <Skeleton
                className="h-4 max-w-(--skeleton-width) flex-1"
                data-sidebar="menu-skeleton-text"
                style={
                    {
                        "--skeleton-width": width,
                    } as React.CSSProperties
                }
            />
        </div>
    )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
    const { isRtl } = useSidebar()

    return (
        <ul
            data-slot="sidebar-menu-sub"
            data-sidebar="menu-sub"
            className={cn(
                "border-sidebar-border flex min-w-0 flex-col gap-1 px-2.5 py-0.5",
                "mx-3.5 border-s",
                isRtl ? "-translate-x-px" : "translate-x-px",
                "group-data-[collapsible=icon]:hidden",
                className
            )}
            {...props}
        />
    )
}

function SidebarMenuSubItem({
                                className,
                                ...props
                            }: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="sidebar-menu-sub-item"
            data-sidebar="menu-sub-item"
            className={cn("group/menu-sub-item relative", className)}
            {...props}
        />
    )
}

function SidebarMenuSubButton({
                                  asChild = false,
                                  size = "md",
                                  isActive = false,
                                  className,
                                  ...props
                              }: React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
}) {
    const Comp = asChild ? Slot : "a"
    const { isRtl } = useSidebar()

    return (
        <Comp
            data-slot="sidebar-menu-sub-button"
            data-sidebar="menu-sub-button"
            data-size={size}
            data-active={isActive}
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                "text-start",
                isRtl ? "translate-x-px" : "-translate-x-px",
                "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                "group-data-[collapsible=icon]:hidden",
                className
            )}
            {...props}
        />
    )
}

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
}
