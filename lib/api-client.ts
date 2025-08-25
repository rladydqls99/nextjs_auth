import { isTokenExpired } from "./auth"
import { getAuthTokens, refreshTokens } from "./auth-actions"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export interface ServerTokens {
  accessToken?: string
  refreshToken?: string
}

class ApiClient {
  private baseURL: string
  private serverTokens?: ServerTokens

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  setServerTokens(tokens: ServerTokens) {
    this.serverTokens = tokens
  }

  private async getValidAccessToken(): Promise<string | null> {
    if (this.serverTokens?.accessToken) {
      if (!isTokenExpired(this.serverTokens.accessToken)) {
        return this.serverTokens.accessToken
      }
      // Try to refresh server tokens
      if (this.serverTokens.refreshToken) {
        try {
          const refreshed = await refreshTokens()
          if (refreshed) {
            const newTokens = await getAuthTokens()
            if (newTokens) {
              this.serverTokens = newTokens
              return newTokens.accessToken
            }
          }
        } catch (error) {
          this.serverTokens = undefined
          return null
        }
      }
    }

    // For client-side, we can't access HTTP-only cookies directly
    // This will be handled by server components or server actions
    return null
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let accessToken = await this.getValidAccessToken()

    const makeRequest = async (token: string | null): Promise<Response> => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      return fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      })
    }

    let response = await makeRequest(accessToken)

    // If we get a 401 and we have a token, try to refresh and retry once
    if (response.status === 401 && accessToken) {
      try {
        // Try to refresh tokens via server action
        const refreshed = await refreshTokens()
        if (refreshed) {
          const newTokens = await getAuthTokens()
          if (newTokens) {
            this.serverTokens = newTokens
            accessToken = newTokens.accessToken
            response = await makeRequest(accessToken)
          }
        }
      } catch (refreshError) {
        this.serverTokens = undefined
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.serverTokens = undefined
        throw new Error("Unauthorized")
      }

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

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  // Dashboard endpoints
  async getDashboard() {
    return this.request<any>("/api/dashboard")
  }

  async getUser() {
    return this.request<any>("/api/user")
  }
}

export const apiClient = new ApiClient()

export function createServerApiClient(tokens?: ServerTokens): ApiClient {
  const client = new ApiClient()
  if (tokens) {
    client.setServerTokens(tokens)
  }
  return client
}
