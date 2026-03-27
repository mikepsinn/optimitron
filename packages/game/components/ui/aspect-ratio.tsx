'use client'

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'
import type { AspectRatioProps } from '@radix-ui/react-aspect-ratio'

function AspectRatio({
  ...props
}: AspectRatioProps) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
