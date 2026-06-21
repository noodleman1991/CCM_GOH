"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label,
  openAccordion,
  setOpenAccordionAction,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    /** Render as a call-to-action affordance (e.g. "Start or find a project"). */
    isAction?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
      isActive?: boolean
    }[]
    onToggle?: () => void
  }[]
  /** Optional section heading rendered above the group (e.g. "Explore"). */
  label?: string
  openAccordion?: string | null
  setOpenAccordionAction?: (value: string | null) => void
}) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          // If item has items, it's an accordion
          if (item.items?.length) {
            return (
              <Collapsible
                key={item.title}
                asChild
                open={item.isActive}
                onOpenChange={item.onToggle}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight className="ms-auto transition-transform duration-200 data-[state=open]:rotate-90 rtl:-scale-x-100" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem, index) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                            className="h-auto py-1 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words [&>span:last-child]:truncate-none [&>span:last-child]:hyphens-auto"
                          >
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon />}
                              <span className="leading-tight">
                                {subItem.title}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          // Regular menu item
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
                className={cn(
                  item.isAction &&
                    // CTA affordance on the navy sidebar: cyan accent + dashed
                    // outline so it reads as "do something", not just navigate.
                    "text-secondary [&>svg]:text-secondary border border-dashed border-sidebar-border/60 hover:border-secondary/60"
                )}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
