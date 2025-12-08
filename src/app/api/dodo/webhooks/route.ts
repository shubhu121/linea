import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { subscriptions, paymentEvents, usageTracking } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DodoWebhookEvent } from '@/types/dodo';
import { getPlanByDodoProductId, PLAN_LIMITS } from '@/config/plans';

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

function getPlanTypeFromProductId(productId: string): 'free' | 'pro' | 'enterprise' {
  const plan = getPlanByDodoProductId(productId);
  return (plan?.id as 'free' | 'pro' | 'enterprise') || 'free';
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-dodo-signature') || '';
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.error('DODO_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify signature
    const isValid = await verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event: DodoWebhookEvent = JSON.parse(payload);
    const now = new Date().toISOString();

    // Handle subscription events
    switch (event.type) {
      case 'subscription.created': {
        const { subscription_id, customer_id, product_id, status } = event.data;
        
        // Find user by customer ID
        const userSub = await db.select()
          .from(subscriptions)
          .where(eq(subscriptions.dodoCustomerId, customer_id))
          .limit(1);

        if (userSub.length === 0) {
          console.error(`No user found for customer ${customer_id}`);
          break;
        }

        const userId = userSub[0].userId;
        const planType = getPlanTypeFromProductId(product_id);

        // Update subscription
        await db.update(subscriptions)
          .set({
            dodoSubscriptionId: subscription_id,
            planType,
            status: status as any,
            currentPeriodStart: now,
            updatedAt: now,
          })
          .where(eq(subscriptions.userId, userId));

        // Update usage limits for current month
        const currentMonth = now.slice(0, 7);
        const newLimit = PLAN_LIMITS[planType];

        await db.update(usageTracking)
          .set({
            conceptTracesLimit: newLimit,
            updatedAt: now,
          })
          .where(eq(usageTracking.userId, userId));

        // Log event
        await db.insert(paymentEvents).values({
          userId,
          eventType: 'subscription.created',
          dodoEventId: `${subscription_id}_created`,
          eventData: JSON.stringify(event.data),
          processedAt: now,
        });

        console.log(`Subscription created: ${subscription_id} for user ${userId}, plan: ${planType}`);
        break;
      }

      case 'subscription.updated': {
        const { subscription_id, status, plan_id } = event.data;
        
        // Find subscription by Dodo ID
        const userSub = await db.select()
          .from(subscriptions)
          .where(eq(subscriptions.dodoSubscriptionId, subscription_id))
          .limit(1);

        if (userSub.length === 0) {
          console.error(`No subscription found for ${subscription_id}`);
          break;
        }

        const userId = userSub[0].userId;

        // Update subscription status
        await db.update(subscriptions)
          .set({
            status: status as any,
            updatedAt: now,
          })
          .where(eq(subscriptions.dodoSubscriptionId, subscription_id));

        // Log event
        await db.insert(paymentEvents).values({
          userId,
          eventType: 'subscription.updated',
          dodoEventId: `${subscription_id}_updated_${Date.now()}`,
          eventData: JSON.stringify(event.data),
          processedAt: now,
        });

        console.log(`Subscription updated: ${subscription_id} -> ${status}`);
        break;
      }

      case 'subscription.canceled': {
        const { subscription_id, customer_id } = event.data;
        
        // Find subscription
        const userSub = await db.select()
          .from(subscriptions)
          .where(eq(subscriptions.dodoSubscriptionId, subscription_id))
          .limit(1);

        if (userSub.length === 0) {
          console.error(`No subscription found for ${subscription_id}`);
          break;
        }

        const userId = userSub[0].userId;

        // Mark as canceled and revert to free plan
        await db.update(subscriptions)
          .set({
            status: 'canceled',
            planType: 'free',
            cancelAtPeriodEnd: false,
            updatedAt: now,
          })
          .where(eq(subscriptions.dodoSubscriptionId, subscription_id));

        // Update usage limits to free tier
        await db.update(usageTracking)
          .set({
            conceptTracesLimit: PLAN_LIMITS.free,
            updatedAt: now,
          })
          .where(eq(usageTracking.userId, userId));

        // Log event
        await db.insert(paymentEvents).values({
          userId,
          eventType: 'subscription.canceled',
          dodoEventId: `${subscription_id}_canceled`,
          eventData: JSON.stringify(event.data),
          processedAt: now,
        });

        console.log(`Subscription canceled: ${subscription_id}, reverted to free plan`);
        break;
      }

      case 'subscription.payment_failed': {
        const { subscription_id, customer_id, reason } = event.data;
        
        const userSub = await db.select()
          .from(subscriptions)
          .where(eq(subscriptions.dodoSubscriptionId, subscription_id))
          .limit(1);

        if (userSub.length === 0) break;

        const userId = userSub[0].userId;

        // Update status to past_due
        await db.update(subscriptions)
          .set({
            status: 'past_due',
            updatedAt: now,
          })
          .where(eq(subscriptions.dodoSubscriptionId, subscription_id));

        // Log event
        await db.insert(paymentEvents).values({
          userId,
          eventType: 'payment.failed',
          dodoEventId: `${subscription_id}_failed_${Date.now()}`,
          eventData: JSON.stringify(event.data),
          processedAt: now,
        });

        console.log(`Payment failed for ${subscription_id}: ${reason}`);
        break;
      }

      case 'payment.completed': {
        const { payment_id, customer_id } = event.data;
        
        const userSub = await db.select()
          .from(subscriptions)
          .where(eq(subscriptions.dodoCustomerId, customer_id))
          .limit(1);

        if (userSub.length === 0) break;

        const userId = userSub[0].userId;

        // Log payment completion
        await db.insert(paymentEvents).values({
          userId,
          eventType: 'payment.completed',
          dodoEventId: payment_id,
          eventData: JSON.stringify(event.data),
          processedAt: now,
        });

        console.log(`Payment completed: ${payment_id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${(event as any).type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}