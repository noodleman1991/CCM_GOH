import dynamic from 'next/dynamic'

// Client-only rendering to avoid hydration mismatches with Radix UI's useId()
export const Select = dynamic(
  () => import('./select-client').then(mod => mod.Select),
  { ssr: false }
)

export const SelectContent = dynamic(
  () => import('./select-client').then(mod => mod.SelectContent),
  { ssr: false }
)

export const SelectGroup = dynamic(
  () => import('./select-client').then(mod => mod.SelectGroup),
  { ssr: false }
)

export const SelectItem = dynamic(
  () => import('./select-client').then(mod => mod.SelectItem),
  { ssr: false }
)

export const SelectLabel = dynamic(
  () => import('./select-client').then(mod => mod.SelectLabel),
  { ssr: false }
)

export const SelectScrollDownButton = dynamic(
  () => import('./select-client').then(mod => mod.SelectScrollDownButton),
  { ssr: false }
)

export const SelectScrollUpButton = dynamic(
  () => import('./select-client').then(mod => mod.SelectScrollUpButton),
  { ssr: false }
)

export const SelectSeparator = dynamic(
  () => import('./select-client').then(mod => mod.SelectSeparator),
  { ssr: false }
)

export const SelectTrigger = dynamic(
  () => import('./select-client').then(mod => mod.SelectTrigger),
  { ssr: false }
)

export const SelectValue = dynamic(
  () => import('./select-client').then(mod => mod.SelectValue),
  { ssr: false }
)
