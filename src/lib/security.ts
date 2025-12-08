import { NextRequest } from "next/server";
import { db } from "@/db";
import { session, concepts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

/**
 * Verify bearer token and return authenticated user
 * Throws error if authentication fails
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  
  // Input validation - prevent injection attempts
  if (!/^[a-zA-Z0-9_-]+$/.test(token) || token.length > 512) {
    throw new Error("Invalid token format");
  }

  // Verify token in session table
  const [userSession] = await db
    .select({
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(eq(session.token, token))
    .limit(1);

  if (!userSession) {
    throw new Error("Invalid or expired session");
  }

  // Check if session is expired
  if (userSession.expiresAt < new Date()) {
    throw new Error("Session expired");
  }

  return {
    userId: userSession.userId,
    sessionId: userSession.id,
  };
}

/**
 * Verify concept ownership
 * Returns concept if user owns it, throws error otherwise
 */
export async function verifyConceptOwnership(
  conceptSlug: string,
  userId: string
): Promise<{ id: number; slug: string; userId: string }> {
  // Input validation for slug
  if (!conceptSlug || typeof conceptSlug !== "string" || conceptSlug.length > 100) {
    throw new Error("Invalid concept slug");
  }

  const [concept] = await db
    .select({
      id: concepts.id,
      slug: concepts.slug,
      userId: concepts.userId,
    })
    .from(concepts)
    .where(eq(concepts.slug, conceptSlug))
    .limit(1);

  if (!concept) {
    throw new Error("Concept not found");
  }

  // Verify ownership
  if (concept.userId !== userId) {
    throw new Error("Unauthorized access to concept");
  }

  return concept;
}

/**
 * Rate limiting middleware
 * Returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;

  let rateLimitData = rateLimitStore.get(key);

  // Reset if window expired
  if (!rateLimitData || rateLimitData.resetAt < now) {
    rateLimitData = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  rateLimitData.count++;
  rateLimitStore.set(key, rateLimitData);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  return {
    allowed: rateLimitData.count <= maxRequests,
    remaining: Math.max(0, maxRequests - rateLimitData.count),
    resetAt: rateLimitData.resetAt,
  };
}

/**
 * Get client identifier for rate limiting (IP + User-Agent)
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Create a fingerprint
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Sanitize input strings to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  // Slug should be alphanumeric with hyphens, reasonable length
  return /^[a-z0-9-]{3,100}$/.test(slug);
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };
}

/**
 * Validate request content type
 */
export function validateContentType(request: NextRequest, expectedType: string = "application/json"): boolean {
  const contentType = request.headers.get("content-type");
  return contentType?.includes(expectedType) || false;
}
