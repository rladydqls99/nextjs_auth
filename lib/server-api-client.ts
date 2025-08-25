import { getAuthTokens, refreshTokens } from "./auth-actions"
import { isTokenExpired } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

class ServerApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async getValidAccessToken(): Promise<string | null> {
    const tokens = await getAuthTokens()
    if (!tokens) return null

    // If access token is still valid, return it
    if (!isTokenExpired(tokens.accessToken)) {
      return tokens.accessToken
    }

    // Try to refresh the token
    try {
      const refreshed = await refreshTokens()
      if (refreshed) {
        const newTokens = await getAuthTokens()
        return newTokens?.accessToken || null
      }
    } catch (error) {
      return null
    }

    return null
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.getValidAccessToken()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Dashboard endpoints
  async getDashboard() {
    return this.request<any>("/api/dashboard")
  }

  async getUser() {
    return this.request<any>("/api/user")
  }
}

export const serverApiClient = new ServerApiClient()
