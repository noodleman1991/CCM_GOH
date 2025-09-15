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
  setOpenAccordion,
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
  setOpenAccordion?: (value: string | null) => void
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
                      <ChevronRight className="ml-auto transition-transform duration-200 data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem, index) => {
                        // Check if this is the Regional Communities accordion
                        const isRegionalCommunity = item.title && (item.title.toLowerCase().includes('regional') || item.title.toLowerCase().includes('communities'))
                        return (
                          <SidebarMenuSubItem
                            key={subItem.title}
                            className={cn(
                              isRegionalCommunity && "mb-0.5"
                            )}
                          >
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                isRegionalCommunity && "min-h-fit py-1 h-auto"
                              )}
                            >
                              <a href={subItem.url}>
                                {subItem.icon && <subItem.icon />}
                                <span className={cn(
                                  isRegionalCommunity
                                    ? "whitespace-normal break-words leading-tight overflow-wrap-break-word hyphens-auto"
                                    : ""
                                )}>
                                  {subItem.title}
                                </span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
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
