"use client"

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query"
import type React from "react"

interface HydrationBoundaryWrapperProps {
  dehydratedState: DehydratedState | null
  children: React.ReactNode
}

export function HydrationBoundaryWrapper({ dehydratedState, children }: HydrationBoundaryWrapperProps) {
  if (!dehydratedState) {
    return <>{children}</>
  }

  return <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
}
