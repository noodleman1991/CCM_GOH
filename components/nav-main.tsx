"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
  openAccordion,
  setOpenAccordionAction,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
    onToggle?: () => void
  }[]
  openAccordion?: string | null
  setOpenAccordionAction?: (value: string | null) => void
}) {
  return (
    <SidebarGroup>
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
                            className="h-auto py-1 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words [&>span:last-child]:truncate-none [&>span:last-child]:hyphens-auto"
                          >
                            <a href={subItem.url}>
                              {subItem.icon && <subItem.icon />}
                              <span className="leading-tight">
                                {subItem.title}
                              </span>
                            </a>
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
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
