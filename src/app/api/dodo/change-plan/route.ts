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

    const body = await request.json();
    const { newProductId } = body;

    if (!newProductId) {
      return NextResponse.json(
        { error: 'New product ID is required' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Get user's subscription
    const userSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSubscription.length === 0 || !userSubscription[0].dodoSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const dodoSubscriptionId = userSubscription[0].dodoSubscriptionId;

    // Change plan in Dodo
    const updatedSubscription = await dodoClient.subscriptions.changePlan({
      subscription_id: dodoSubscriptionId,
      product_id: newProductId,
      proration_behavior: 'charge_on_next_cycle',
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    }, { headers: getSecurityHeaders() });

  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { error: 'Failed to change plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
