"use client"

import { useLocale } from "next-intl"
import { rtlLocales } from "@/i18n/routing"

/**
 * Returns the text direction ('rtl' | 'ltr') based on the current locale.
 * Pass the result to Radix UI primitives that accept a `dir` prop
 * (Select, Dialog, DropdownMenu, Popover, etc.).
 */
export function useDirection(): "rtl" | "ltr" {
  const locale = useLocale()
  return rtlLocales.includes(locale) ? "rtl" : "ltr"
}
