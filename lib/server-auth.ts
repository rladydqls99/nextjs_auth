import { cookies } from "next/headers"
import { type AuthTokens, isTokenExpired } from "./auth"

export async function getServerTokens(): Promise<AuthTokens | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value
  const refreshToken = cookieStore.get("refreshToken")?.value

  if (!accessToken || !refreshToken) {
    return null
  }

  return { accessToken, refreshToken }
}

export async function setServerTokens(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies()

  // Set secure HTTP-only cookies for server-side token storage
  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function clearServerTokens(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("accessToken")
  cookieStore.delete("refreshToken")
}

export async function getValidServerTokens(): Promise<AuthTokens | null> {
  const tokens = await getServerTokens()
  if (!tokens) return null

  // If access token is still valid, return tokens
  if (!isTokenExpired(tokens.accessToken)) {
    return tokens
  }

  // Access token expired, try to refresh
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })

    if (!response.ok) {
      await clearServerTokens()
      return null
    }

    const data = await response.json()
    const newTokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }

    await setServerTokens(newTokens)
    return newTokens
  } catch (error) {
    await clearServerTokens()
    return null
  }
}
