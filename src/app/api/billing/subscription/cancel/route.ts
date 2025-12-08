import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization header with Bearer token is required',
        code: 'MISSING_AUTH_HEADER'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const userSession = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      }, { status: 401 });
    }

    const currentSession = userSession[0];
    const now = new Date();

    if (currentSession.expiresAt < now) {
      return NextResponse.json({ 
        error: 'Session has expired',
        code: 'EXPIRED_SESSION'
      }, { status: 401 });
    }

    const userId = currentSession.userId;

    const userSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSubscription.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscription found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      }, { status: 404 });
    }

    const subscription = userSubscription[0];

    if (subscription.status !== 'active') {
      return NextResponse.json({ 
        error: 'Cannot cancel a subscription that is not active',
        code: 'SUBSCRIPTION_NOT_ACTIVE'
      }, { status: 400 });
    }

    const updated = await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update subscription',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }

    const updatedSubscription = updated[0];

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSubscription.id,
        planType: updatedSubscription.planType,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        message: 'Subscription will be canceled at period end'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}