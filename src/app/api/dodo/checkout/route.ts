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
    const { productId, email } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Get or create Dodo customer
    const userSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    let dodoCustomerId = userSubscription[0]?.dodoCustomerId;

    // Create customer if doesn't exist
    if (!dodoCustomerId) {
      const customer = await dodoClient.customers.create({
        email: email,
        metadata: {
          userId: userId,
          source: 'linea_app',
        },
      });
      dodoCustomerId = customer.customer_id;

      // Update subscription with customer ID
      await db.update(subscriptions)
        .set({
          dodoCustomerId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptions.userId, userId));
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    
    const checkout = await dodoClient.checkoutSessions.create({
      checkout_session: {
        success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
      },
      line_items: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        customer_id: dodoCustomerId,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkout_url,
      sessionId: checkout.checkout_session_id,
    }, { headers: getSecurityHeaders() });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
