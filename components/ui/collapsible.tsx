"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { useStableId } from "@/lib/use-stable-id"

function Collapsible({
  id,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  id?: string
}) {
  const stableId = useStableId('collapsible', id)
  return <CollapsiblePrimitive.Root data-slot="collapsible" id={stableId} {...props} />
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
