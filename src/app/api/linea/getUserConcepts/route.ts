import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { concepts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth, checkRateLimit, getClientIdentifier, getSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 100 requests per minute per client
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 100, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          }
        }
      );
    }

    // Authenticate user
    const user = await verifyAuth(request);

    // Query concepts for authenticated user only
    const userConcepts = await db.select({
      id: concepts.id,
      slug: concepts.slug,
      originalConcept: concepts.originalConcept,
      refinedConcept: concepts.refinedConcept,
      status: concepts.status,
      createdAt: concepts.createdAt,
      updatedAt: concepts.updatedAt
    })
      .from(concepts)
      .where(eq(concepts.userId, user.userId))
      .orderBy(desc(concepts.createdAt));

    return NextResponse.json(
      { success: true, data: userConcepts },
      { 
        status: 200,
        headers: {
          ...getSecurityHeaders(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        }
      }
    );

  } catch (error) {
    console.error('GET concepts error:', error);

    // Return appropriate error based on type
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Invalid') || error.message.includes('expired')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401, headers: getSecurityHeaders() }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch user concepts' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}