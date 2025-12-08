import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, usageTracking, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const userUsage = await db.select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.month, currentMonth)
        )
      )
      .limit(1);

    const subscriptionData = userSubscription.length > 0 ? {
      id: userSubscription[0].id,
      planType: userSubscription[0].planType,
      status: userSubscription[0].status,
      currentPeriodStart: userSubscription[0].currentPeriodStart,
      currentPeriodEnd: userSubscription[0].currentPeriodEnd,
      cancelAtPeriodEnd: userSubscription[0].cancelAtPeriodEnd ?? false,
      dodoCustomerId: userSubscription[0].dodoCustomerId,
      dodoSubscriptionId: userSubscription[0].dodoSubscriptionId
    } : null;

    const usageData = userUsage.length > 0 ? {
      month: userUsage[0].month,
      conceptTracesUsed: userUsage[0].conceptTracesUsed,
      conceptTracesLimit: userUsage[0].conceptTracesLimit,
      remaining: userUsage[0].conceptTracesLimit - userUsage[0].conceptTracesUsed
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscriptionData,
        usage: usageData
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}