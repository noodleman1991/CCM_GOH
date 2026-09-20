"use client";

import * as React from "react";
import { BELOW_SM, useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * One modal surface for every viewport (Slice 13d, audit P4, per the
 * mobile-UX directive: drawers over shrunk desktop dialogs).
 *
 * Below `sm` it is the native bottom Drawer; from `sm` up the centred Dialog.
 * Either way the content is capped at 92dvh, scrolls inside, and pads the
 * bottom by the phone's safe-area inset — so the last button (the cookie
 * banner's Save, the case-study modal's link) is reachable on a landscape
 * phone with the keyboard open. `dvh` rather than `vh`: mobile browsers'
 * collapsing URL bar makes 100vh taller than the visible viewport.
 *
 * `title` is required for the accessible name; pass `titleHidden` when the
 * content carries its own visible heading.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  titleHidden = false,
  children,
  className,
  bodyClassName,
  dir,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  titleHidden?: boolean;
  children: React.ReactNode;
  /** Extra classes for the surface (width caps, fonts). */
  className?: string;
  /** Extra classes for the scrolling body. */
  bodyClassName?: string;
  dir?: "ltr" | "rtl";
}) {
  const isPhone = useMediaQuery(BELOW_SM);
  const safeBottom = "pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6";

  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent dir={dir} className={cn("max-h-[92dvh]", className)}>
          <div
            data-slot="responsive-dialog-body"
            className={cn("max-h-[92dvh] overflow-y-auto p-4", safeBottom, bodyClassName)}
          >
            <DrawerHeader className={cn("px-0 pt-0", titleHidden && "sr-only")}>
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className={cn("max-h-[92dvh] overflow-y-auto p-0", className)}>
        <div data-slot="responsive-dialog-body" className={cn("p-4 sm:p-6", safeBottom, bodyClassName)}>
          <DialogHeader className={cn(titleHidden && "sr-only")}>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
