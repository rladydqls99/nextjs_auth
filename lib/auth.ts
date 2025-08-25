export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  name: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// JWT token utilities
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

export const getTokenPayload = (token: string) => {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = cookies()

  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  })

  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })
}

export async function clearAuthCookies() {
  const cookieStore = cookies()

  cookieStore.delete("accessToken")
  cookieStore.delete("refreshToken")

  redirect("/login")
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const cookieStore = cookies()

  const accessToken = cookieStore.get("accessToken")?.value
  const refreshToken = cookieStore.get("refreshToken")?.value

  if (!accessToken || !refreshToken) return null

  return { accessToken, refreshToken }
}

// Authentication functions
export async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data: AuthResponse = await response.json()

    // Set HTTP-only cookies via server action
    await setAuthCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    }
  }
}

export async function logout(): Promise<void> {
  await clearAuthCookies()
}
