import dynamic from 'next/dynamic'

// Client-only rendering to avoid hydration mismatches with Radix UI's useId()
export const Collapsible = dynamic(
  () => import('./collapsible-client').then(mod => mod.Collapsible),
  { ssr: false }
)

export const CollapsibleTrigger = dynamic(
  () => import('./collapsible-client').then(mod => mod.CollapsibleTrigger),
  { ssr: false }
)

export const CollapsibleContent = dynamic(
  () => import('./collapsible-client').then(mod => mod.CollapsibleContent),
  { ssr: false }
)
