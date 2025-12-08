import { db } from '@/db';
import { user, usageTracking } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentTimestamp = now.toISOString();

    console.log(`📅 Current month: ${currentMonth}`);

    // Query all users from the database
    const allUsers = await db.select().from(user);
    console.log(`👥 Found ${allUsers.length} users in database`);

    if (allUsers.length === 0) {
        console.log('⚠️  No users found. Please seed users first.');
        return;
    }

    // Query existing usage tracking records for current month
    const existingUsageRecords = await db
        .select({ userId: usageTracking.userId })
        .from(usageTracking)
        .where(eq(usageTracking.month, currentMonth));

    const existingUserIds = new Set(existingUsageRecords.map(record => record.userId));
    console.log(`📊 Found ${existingUserIds.size} users with existing usage records for ${currentMonth}`);

    // Filter out users who already have usage records for current month
    const usersNeedingUsageRecords = allUsers.filter(u => !existingUserIds.has(u.id));

    if (usersNeedingUsageRecords.length === 0) {
        console.log('✅ All users already have usage tracking records for current month');
        return;
    }

    console.log(`🔧 Creating usage records for ${usersNeedingUsageRecords.length} users`);

    // Create usage tracking records for users without current month records
    const newUsageRecords = usersNeedingUsageRecords.map(u => ({
        userId: u.id,
        month: currentMonth,
        conceptTracesUsed: 0,
        conceptTracesLimit: 5,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
    }));

    await db.insert(usageTracking).values(newUsageRecords);
    
    console.log('✅ Usage tracking seeder completed successfully');
    console.log(`   - Initialized ${newUsageRecords.length} new usage records`);
    console.log(`   - Month: ${currentMonth}`);
    console.log(`   - Default limit: 5 concept traces per user`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});