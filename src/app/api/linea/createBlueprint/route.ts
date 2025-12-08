import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { concepts, veritusJobs, session } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { runConceptAgent, runPhraseAgent, runStrategyAgent } from "@/lib/agents";
import { createCombinedSearchJob } from "@/lib/veritus";

const requestSchema = z.object({
  concept: z.string().min(3, "Concept must be at least 3 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token by querying session table
    const [userSession] = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (!userSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // **NEW: Check usage quota before proceeding**
    const usageCheckResponse = await fetch(`${request.nextUrl.origin}/api/billing/usage/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!usageCheckResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to check usage quota" },
        { status: 500 }
      );
    }

    const usageCheck = await usageCheckResponse.json();
    
    if (!usageCheck.data.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Usage limit reached",
          code: "QUOTA_EXCEEDED",
          data: {
            used: usageCheck.data.used,
            limit: usageCheck.data.limit,
            planType: usageCheck.data.planType,
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { concept } = requestSchema.parse(body);

    const now = new Date().toISOString();
    const slug = `${concept.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 50)}-${nanoid(8)}`;

    // Step 1: Create concept record with userId
    const [insertedConcept] = await db
      .insert(concepts)
      .values({
        slug,
        originalConcept: concept,
        userId,
        status: "processing",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Step 2: Agent 1 - Concept Agent (refine concept) - Direct call
    const conceptData = await runConceptAgent(concept);
    const { refinedConcept, keyEntities, disciplinaryContext } = conceptData;

    // Update concept with refined version
    await db
      .update(concepts)
      .set({
        refinedConcept,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(concepts.id, insertedConcept.id));

    // Step 3: Agent 2 - Phrase Agent (generate search phrases) - Direct call
    const phraseData = await runPhraseAgent(refinedConcept, keyEntities, disciplinaryContext);
    const { phrases } = phraseData;

    // Step 4: Agent 3 - Strategy Agent (optimize search strategy) - Direct call
    const strategyData = await runStrategyAgent(refinedConcept, phrases);
    const { selectedPhrases, searchParameters } = strategyData;

    // Step 5: Create ONE Veritus job with ALL selected phrases
    // Construct callback URL - use env var if set (should be full URL), otherwise build from request headers
    const callbackUrl = process.env.VERITUS_CALLBACK_URL || 
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('x-forwarded-host') || request.headers.get('host')}/api/veritus/callback`;
    
    const useMock = !process.env.VERITUS_API_KEY || process.env.VERITUS_API_KEY === 'your_veritus_api_key_here';

    // Convert null values to undefined for Veritus API
    const veritusParams = {
      phrases: selectedPhrases,
      query: refinedConcept,
      limit: searchParameters?.maxResultsPerPhrase as 100 | 200 | 300 | undefined,
      minCitationCount: searchParameters?.citationThreshold ?? undefined,
      year: searchParameters?.dateRangeStart && searchParameters?.dateRangeEnd
        ? `${searchParameters.dateRangeStart}:${searchParameters.dateRangeEnd}`
        : undefined,
    };

    let veritusJob;
    
    if (useMock) {
      veritusJob = await createMockSearchJob(veritusParams);
    } else {
      veritusJob = await createCombinedSearchJob(veritusParams, callbackUrl);
    }

    // Store single job in database
    const jobNow = new Date().toISOString();
    await db.insert(veritusJobs).values({
      conceptId: insertedConcept.id,
      jobId: veritusJob.jobId,
      searchPhrase: selectedPhrases.join(", "),
      status: 'pending',
      createdAt: jobNow,
      updatedAt: jobNow,
    });

    // **NEW: Track usage after successful creation**
    await fetch(`${request.nextUrl.origin}/api/billing/usage/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // If using mock, auto-trigger the simulated callback so the concept can complete
    if (useMock) {
      try {
        await fetch(`${request.nextUrl.origin}/api/linea/simulateCallback/${veritusJob.jobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Failed to trigger mock callback', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        conceptId: insertedConcept.id,
        slug: insertedConcept.slug,
        refinedConcept,
        selectedPhrases,
        remaining: usageCheck.data.remaining - 1,
        message: "Blueprint created. Search job is being processed.",
      },
    });
  } catch (error) {
    console.error("Create blueprint error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create blueprint" },
      { status: 500 }
    );
  }
}