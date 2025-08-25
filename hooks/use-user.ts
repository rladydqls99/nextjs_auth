"use client"

import { apiClient } from "@/lib/api-client"
import { useAuthQuery } from "./use-auth-query"

export interface UserData {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  lastLogin: string
  preferences: {
    theme: string
    notifications: boolean
  }
}

export function useUser() {
  return useAuthQuery(["user"], () => apiClient.getUser() as Promise<UserData>, {
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
