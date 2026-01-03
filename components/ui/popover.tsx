import dynamic from 'next/dynamic'

// Client-only rendering to avoid hydration mismatches with Radix UI's useId()
export const Popover = dynamic(
  () => import('./popover-client').then(mod => mod.Popover),
  { ssr: false }
)

export const PopoverTrigger = dynamic(
  () => import('./popover-client').then(mod => mod.PopoverTrigger),
  { ssr: false }
)

export const PopoverContent = dynamic(
  () => import('./popover-client').then(mod => mod.PopoverContent),
  { ssr: false }
)
