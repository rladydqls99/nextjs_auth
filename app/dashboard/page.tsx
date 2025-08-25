import { redirect } from "next/navigation"
import { getValidServerTokens } from "@/lib/server-auth"
import { prefetchDashboardData } from "@/lib/server-prefetch"
import { HydrationBoundaryWrapper } from "@/components/hydration-boundary"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  // Check authentication on server side
  const tokens = await getValidServerTokens()

  if (!tokens) {
    redirect("/login")
  }

  // Prefetch data on server side
  const { dehydratedState } = await prefetchDashboardData()

  return (
    <HydrationBoundaryWrapper dehydratedState={dehydratedState}>
      <DashboardClient />
    </HydrationBoundaryWrapper>
  )
}
