import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session, subscriptions, usageTracking } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: 500,
} as const;

type PlanType = keyof typeof PLAN_LIMITS;

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const userSession = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return null;
    }

    const sessionData = userSession[0];

    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function POST(request: NextRequest) {
  try {
    const userSession = await authenticateUser(request);
    
    if (!userSession) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;
    const currentMonth = getCurrentMonth();

    let userSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1);

    const planType: PlanType = userSubscription.length > 0 
      ? (userSubscription[0].planType as PlanType) 
      : 'free';

    const planLimit = PLAN_LIMITS[planType];

    let usage = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.month, currentMonth)
        )
      )
      .limit(1);

    if (usage.length === 0) {
      const newUsage = await db
        .insert(usageTracking)
        .values({
          userId: userId,
          month: currentMonth,
          conceptTracesUsed: 0,
          conceptTracesLimit: planLimit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      usage = newUsage;
    }

    const usageData = usage[0];
    const remaining = usageData.conceptTracesLimit - usageData.conceptTracesUsed;
    const allowed = remaining > 0;

    return NextResponse.json({
      success: true,
      data: {
        allowed,
        remaining,
        used: usageData.conceptTracesUsed,
        limit: usageData.conceptTracesLimit,
        planType,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}