import dynamic from 'next/dynamic'

// Client-only rendering to avoid hydration mismatches with Radix UI's useId()
export const DropdownMenu = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenu),
  { ssr: false }
)

export const DropdownMenuPortal = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuPortal),
  { ssr: false }
)

export const DropdownMenuTrigger = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuTrigger),
  { ssr: false }
)

export const DropdownMenuContent = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuContent),
  { ssr: false }
)

export const DropdownMenuGroup = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuGroup),
  { ssr: false }
)

export const DropdownMenuLabel = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuLabel),
  { ssr: false }
)

export const DropdownMenuItem = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuItem),
  { ssr: false }
)

export const DropdownMenuCheckboxItem = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuCheckboxItem),
  { ssr: false }
)

export const DropdownMenuRadioGroup = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuRadioGroup),
  { ssr: false }
)

export const DropdownMenuRadioItem = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuRadioItem),
  { ssr: false }
)

export const DropdownMenuSeparator = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuSeparator),
  { ssr: false }
)

export const DropdownMenuShortcut = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuShortcut),
  { ssr: false }
)

export const DropdownMenuSub = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuSub),
  { ssr: false }
)

export const DropdownMenuSubTrigger = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuSubTrigger),
  { ssr: false }
)

export const DropdownMenuSubContent = dynamic(
  () => import('./dropdown-menu-client').then(mod => mod.DropdownMenuSubContent),
  { ssr: false }
)
