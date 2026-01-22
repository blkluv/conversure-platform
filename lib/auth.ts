// Authentication utilities
import { prisma } from "@/lib/db"
import * as bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export interface SessionUser {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
}

// Define User type manually since Prisma client may not be generated yet
interface User {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
  passwordHash: string
  isActive: boolean
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

/**
 * Require specific role(s) - throws if user doesn't have required role
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Required role(s): ${allowedRoles.join(', ')}`)
  }

  return user
}

/**
 * Require company admin role
 */
export async function requireCompanyAdmin(): Promise<SessionUser> {
  return requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
}

/**
 * Get current user's company ID
 */
export async function getCompanyId(): Promise<string> {
  const user = await requireAuth()
  return user.companyId
}

/**
 * Verify user belongs to specified company (multi-tenant isolation)
 */
export async function verifyCompanyAccess(companyId: string): Promise<void> {
  const user = await requireAuth()

  if (user.companyId !== companyId) {
    throw new Error('Forbidden: Access denied to this company resource')
  }
}

/**
 * Check if user has permission for action
 * Extends RBAC with custom permissions
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ['*'], // All permissions
    COMPANY_ADMIN: [
      'users:manage',
      'company:edit',
      'leads:manage',
      'campaigns:manage',
      'integrations:manage',
      'billing:view'
    ],
    AGENT: [
      'leads:view',
      'leads:edit',
      'conversations:manage',
      'messages:send'
    ],
    VIEWER: [
      'leads:view',
      'conversations:view',
      'reports:view'
    ]
  }

  const permissions = rolePermissions[user.role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAuth()
  const allowed = await hasPermission(permission)

  if (!allowed) {
    throw new Error(`Forbidden: Missing permission '${permission}'`)
  }

  return user
}

