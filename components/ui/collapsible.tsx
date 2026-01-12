"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

function Collapsible({
  id,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  id?: string
}) {
  // Radix UI handles IDs internally - removed useStableId to fix hydration errors
  // Suppress hydration warning due to Radix UI useId mismatch in Next.js 16/React 19
  // See: https://github.com/radix-ui/primitives/issues/3700
  return <CollapsiblePrimitive.Root data-slot="collapsible" id={id} suppressHydrationWarning {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
