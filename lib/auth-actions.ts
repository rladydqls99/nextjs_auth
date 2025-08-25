"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { type User, type AuthResponse, getTokenPayload, isTokenExpired } from "./auth"

export async function loginAction(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error("Invalid credentials")
    }

    const data: AuthResponse = await response.json()

    const cookieStore = cookies()

    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    })

    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { success: true, user: data.user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    }
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = cookies()

  cookieStore.delete("accessToken")
  cookieStore.delete("refreshToken")

  redirect("/login")
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("accessToken")?.value

  if (!accessToken) return null

  if (isTokenExpired(accessToken)) {
    const refreshed = await refreshTokens()
    if (!refreshed) return null

    // Get the new access token after refresh
    const newAccessToken = cookieStore.get("accessToken")?.value
    if (!newAccessToken) return null

    const payload = getTokenPayload(newAccessToken)
    return payload
      ? {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
        }
      : null
  }

  const payload = getTokenPayload(accessToken)
  return payload
    ? {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      }
    : null
}

export async function refreshTokens(): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value

    if (!refreshToken) return false

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return false

    const data = await response.json()

    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    })

    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return true
  } catch (error) {
    return false
  }
}

export async function getAuthTokens() {
  const cookieStore = cookies()

  const accessToken = cookieStore.get("accessToken")?.value
  const refreshToken = cookieStore.get("refreshToken")?.value

  if (!accessToken || !refreshToken) return null

  return { accessToken, refreshToken }
}
