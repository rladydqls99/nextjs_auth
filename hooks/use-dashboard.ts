import { apiClient } from "@/lib/api-client"
import { useAuthQuery } from "./use-auth-query"

export interface DashboardData {
  totalUsers: number
  totalRevenue: number
  activeProjects: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
}

export function useDashboard() {
  return useAuthQuery(["dashboard"], () => apiClient.getDashboard() as Promise<DashboardData>, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
