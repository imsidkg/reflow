import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type { User, Session } from "../generated/prisma/client";

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SessionData {
  user: AuthUser;
  session: Session;
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = 60 * 60 * 2; // 2 hours in seconds
const COOKIE_NAME = "access-token";

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);
    return token?.value || null;
  } catch (error) {
    console.error("Error reading cookies:", error);
    return null;
  }
}

export async function setAuthCookie(
  token: string,
  options?: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  }
): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(COOKIE_NAME, token, {
    path: "/",
    maxAge: options?.maxAge || 60 * 60 * 2,
    httpOnly: options?.httpOnly ?? true,
    secure: options?.secure ?? isProduction,
    sameSite: options?.sameSite || "lax",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function validateSession(
  token: string
): Promise<SessionData | null> {
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      user: session.user,
      session: {
        id: session.id,
        token: session.token,
        userId: session.userId,
      },
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const token = await getTokenFromCookies();
  if (!token) {
    return null;
  }

  return validateSession(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getTokenFromCookies();
  if (!token) {
    return false;
  }

  const payload = verifyToken(token);
  return payload !== null;
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getCurrentUser();

  if (!session) {
    throw new Error("Unauthorized: User must be authenticated");
  }

  return session;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentUser();
  return session?.user.id || null;
}

export async function createSession(userId: string): Promise<{
  session: Session;
  token: string;
}> {
  const token = generateToken(userId);

  const session = await prisma.session.create({
    data: {
      token,
      userId,
    },
  });

  return { session, token };
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { token },
    });
  } catch (error) {
    console.error("Error deleting session:", error);
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error("Error deleting user sessions:", error);
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const sessions = await prisma.session.findMany();
    let deletedCount = 0;

    for (const session of sessions) {
      const payload = verifyToken(session.token);
      if (!payload) {
        await prisma.session.delete({
          where: { id: session.id },
        });
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} expired sessions`);
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up sessions:", error);
    return 0;
  }
}

export async function verifyApiAuth(): Promise<SessionData | null> {
  return getCurrentUser();
}

export async function requireApiAuth(): Promise<SessionData> {
  const session = await getCurrentUser();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export const auth = {
  generateToken,
  verifyToken,
  decodeToken,
  getTokenFromCookies,
  setAuthCookie,
  clearAuthCookie,
  validateSession,
  getCurrentUser,
  isAuthenticated,
  getCurrentUserId,
  createSession,
  deleteSession,
  deleteAllUserSessions,
  cleanupExpiredSessions,
  requireAuth,
  requireApiAuth,
  verifyApiAuth,
};

export default auth;
