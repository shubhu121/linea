import { NextRequest, NextResponse } from 'next/server';
import { dodoClient } from '@/lib/dodo';
import { db } from '@/db';
import { session, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSecurityHeaders } from '@/lib/security';

async function authenticateRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];
    
    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // Get user's Dodo customer ID
    const userSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSubscription.length === 0 || !userSubscription[0].dodoCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const dodoCustomerId = userSubscription[0].dodoCustomerId;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Create customer portal session
    const portalSession = await dodoClient.customers.createPortalSession({
      customer_id: dodoCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({
      success: true,
      portalUrl: portalSession.portal_url,
      sessionId: portalSession.session_id,
    }, { headers: getSecurityHeaders() });

  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
