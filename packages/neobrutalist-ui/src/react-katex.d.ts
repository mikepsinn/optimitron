declare module 'react-katex' {
  import type { ComponentType, ReactNode } from 'react'
  export const InlineMath: ComponentType<{ math: string; children?: ReactNode }>
  export const BlockMath: ComponentType<{ math: string; children?: ReactNode }>
}
