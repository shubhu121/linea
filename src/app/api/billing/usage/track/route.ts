import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session, subscriptions, usageTracking } from '@/db/schema';
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

    return userSession.userId;
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
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const currentMonth = getCurrentMonth();

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

      const planType = (userSubscription.length > 0 
        ? userSubscription[0].planType 
        : 'free') as PlanType;

      const limit = PLAN_LIMITS[planType] || PLAN_LIMITS.free;

      const newUsage = await db.insert(usageTracking)
        .values({
          userId,
          month: currentMonth,
          conceptTracesUsed: 1,
          conceptTracesLimit: limit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      usageData = newUsage[0];
    } else {
      const currentUsage = existingUsage[0];
      
      const updated = await db.update(usageTracking)
        .set({
          conceptTracesUsed: currentUsage.conceptTracesUsed + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.month, currentMonth)
          )
        )
        .returning();

      usageData = updated[0];
    }

    const remaining = Math.max(0, usageData.conceptTracesLimit - usageData.conceptTracesUsed);

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
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}