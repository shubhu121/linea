import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session, usageTracking, subscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: 500,
} as const;

type PlanType = keyof typeof PLAN_LIMITS;

async function authenticateRequest(request: NextRequest) {
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

    return userSession;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userSession = await authenticateRequest(request);
    
    if (!userSession) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;
    const currentMonth = new Date().toISOString().substring(0, 7);

    const existingUsage = await db.select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.month, currentMonth)
        )
      )
      .limit(1);

    let usageData;

    if (existingUsage.length === 0) {
      const userSubscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const planType: PlanType = (userSubscription.length > 0 && 
        userSubscription[0].planType in PLAN_LIMITS)
        ? userSubscription[0].planType as PlanType
        : 'free';

      const limit = PLAN_LIMITS[planType];

      const newUsage = await db.insert(usageTracking)
        .values({
          userId,
          month: currentMonth,
          conceptTracesUsed: 0,
          conceptTracesLimit: limit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      usageData = newUsage[0];
    } else {
      usageData = existingUsage[0];
    }

    const remaining = usageData.conceptTracesLimit - usageData.conceptTracesUsed;

    return NextResponse.json({
      success: true,
      data: {
        month: usageData.month,
        conceptTracesUsed: usageData.conceptTracesUsed,
        conceptTracesLimit: usageData.conceptTracesLimit,
        remaining,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}