import { db } from '@/db';
import { user, subscriptions } from '@/db/schema';
import { sql, notInArray } from 'drizzle-orm';

async function main() {
    // Get all users from the database
    const allUsers = await db.select({ id: user.id }).from(user);
    
    if (allUsers.length === 0) {
        console.log('⚠️ No users found in database. Please seed users first.');
        return;
    }

    // Get all existing subscriptions to find users who already have them
    const existingSubscriptions = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions);
    
    const existingUserIds = existingSubscriptions.map(sub => sub.userId);
    
    // Filter out users who already have subscriptions
    const usersWithoutSubscriptions = allUsers.filter(
        u => !existingUserIds.includes(u.id)
    );

    if (usersWithoutSubscriptions.length === 0) {
        console.log('✅ All users already have subscriptions. No action needed.');
        return;
    }

    // Create free plan subscriptions for users without subscriptions
    const now = new Date().toISOString();
    const newSubscriptions = usersWithoutSubscriptions.map(u => ({
        userId: u.id,
        planType: 'free',
        status: 'active',
        dodoCustomerId: null,
        dodoSubscriptionId: null,
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        createdAt: now,
        updatedAt: now,
    }));

    await db.insert(subscriptions).values(newSubscriptions);
    
    console.log(`✅ Subscriptions seeder completed successfully`);
    console.log(`   Created ${newSubscriptions.length} free plan subscriptions`);
    console.log(`   Skipped ${existingUserIds.length} users who already had subscriptions`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});