// Authentication utilities
import { prisma } from "@/lib/db"
import * as bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import type { User } from "@prisma/client"

export interface SessionUser {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
}

// Session management using HTTP-only cookies
export async function createSession(user: User) {
  const sessionData: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    companyId: user.companyId,
  }

  const cookieStore = await cookies()
  // In production, use proper JWT or encrypted session tokens
  cookieStore.set("session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return sessionData
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value) as SessionUser
    return session
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession()
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.role)) {
    throw new Error("Forbidden")
  }

  return session
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// User authentication
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.isActive) {
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)

  if (!isValid) {
    return null
  }

  return user
}
