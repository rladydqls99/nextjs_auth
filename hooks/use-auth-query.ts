"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function useAuthQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  const { isAuthenticated, refreshToken } = useAuth()
  const router = useRouter()

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn()
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          // Try to refresh token once
          const refreshSuccess = await refreshToken()
          if (refreshSuccess) {
            // Retry the query after successful refresh
            return await queryFn()
          } else {
            // Refresh failed, redirect to login
            router.push("/login")
            throw error
          }
        }
        throw error
      }
    },
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message === "Unauthorized") {
        return false
      }
      return failureCount < 3
    },
    ...options,
  })
}
