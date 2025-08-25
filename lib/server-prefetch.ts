import { QueryClient, dehydrate } from "@tanstack/react-query"
import { createServerApiClient } from "./api-client"
import { getValidServerTokens } from "./server-auth"

export async function prefetchDashboardData() {
  const queryClient = new QueryClient()

  try {
    const tokens = await getValidServerTokens()
    if (!tokens) {
      return { queryClient: null, dehydratedState: null }
    }

    const serverApiClient = createServerApiClient(tokens)

    // Prefetch dashboard data
    await queryClient.prefetchQuery({
      queryKey: ["dashboard"],
      queryFn: () => serverApiClient.getDashboard(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Prefetch user data
    await queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: () => serverApiClient.getUser(),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })

    return {
      queryClient,
      dehydratedState: dehydrate(queryClient),
    }
  } catch (error) {
    console.error("Failed to prefetch data:", error)
    return { queryClient: null, dehydratedState: null }
  }
}
