import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { veritusJobs } from "@/db/schema";
import { createCombinedSearchJob } from "@/lib/veritus";

const requestSchema = z.object({
  conceptId: z.number(),
  searchPhrase: z.string().min(3),
  searchParameters: z.object({
    maxResultsPerPhrase: z.number().optional(),
    dateRangeStart: z.string().optional(),
    dateRangeEnd: z.string().optional(),
    includePreprints: z.boolean().optional(),
    citationThreshold: z.number().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conceptId, searchPhrase, searchParameters } = requestSchema.parse(body);

    // Get the base URL for callback
    const baseUrl = process.env.VERITUS_CALLBACK_URL || 
      (request.headers.get('x-forwarded-proto') || 'http') + '://' + 
      (request.headers.get('x-forwarded-host') || request.headers.get('host'));
    
    const callbackUrl = `${baseUrl}/api/veritus/callback`;

    // Create Veritus search job
    let veritusJob;
    
    // Use mock if API key not configured
    if (!process.env.VERITUS_API_KEY || process.env.VERITUS_API_KEY === 'your_veritus_api_key_here') {
      console.log('Using mock Veritus API (no API key configured)');
      veritusJob = await createMockSearchJob({
        query: searchPhrase,
        maxResults: searchParameters?.maxResultsPerPhrase,
        includePreprints: searchParameters?.includePreprints,
        dateRangeStart: searchParameters?.dateRangeStart,
        dateRangeEnd: searchParameters?.dateRangeEnd,
        citationThreshold: searchParameters?.citationThreshold,
      });
    } else {
      veritusJob = await createCombinedSearchJob(
        {
          query: searchPhrase,
          maxResults: searchParameters?.maxResultsPerPhrase,
          includePreprints: searchParameters?.includePreprints,
          dateRangeStart: searchParameters?.dateRangeStart,
          dateRangeEnd: searchParameters?.dateRangeEnd,
          citationThreshold: searchParameters?.citationThreshold,
        },
        callbackUrl
      );
    }

    // Store job in database
    const now = new Date().toISOString();
    const [insertedJob] = await db.insert(veritusJobs).values({
      conceptId,
      jobId: veritusJob.jobId,
      searchPhrase,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      data: {
        id: insertedJob.id,
        jobId: veritusJob.jobId,
        status: veritusJob.status,
        searchPhrase,
      },
    });
  } catch (error) {
    console.error("Create Veritus job error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create search job" },
      { status: 500 }
    );
  }
}