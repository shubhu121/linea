import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { veritusJobs, papers, concepts, lineage, narratives } from "@/db/schema";
import { eq } from "drizzle-orm";

const callbackSchema = z.object({
  jobId: z.string(),
  status: z.enum(['completed', 'failed']),
  results: z.array(
    z.object({
      title: z.string(),
      authors: z.array(z.string()),
      abstract: z.string().optional(),
      publicationDate: z.string().optional(),
      doi: z.string().optional(),
      arxivId: z.string().optional(),
      citations: z.number().optional(),
      sourceUrl: z.string().optional(),
      relevanceScore: z.number().optional(),
    })
  ).optional(),
  error: z.string().optional(),
});

// Accept real Veritus webhook payloads and normalize to our internal schema
// Veritus format reference (subset):
// {
//   data: VeritusPaper[],
//   event: { id: string, createdAt: string, api_version: string },
//   job: { id: string }
// }
function normalizeVeritusPayload(raw: any): { jobId: string; status: 'completed' | 'failed'; results?: any[]; error?: string } | null {
  try {
    const hasRealShape = raw && typeof raw === 'object' && Array.isArray(raw.data) && raw.job && typeof raw.job.id === 'string';
    if (!hasRealShape) return null;

    const parseAuthors = (authors: string | null | undefined): string[] => {
      if (!authors) return [];
      // Split on semicolons or ' and ' first, then fallback to commas while preserving "Last, First" pairs
      const semicolonSplit = authors.split(/;|\sand\s/gi).map(s => s.trim()).filter(Boolean);
      if (semicolonSplit.length > 1) return semicolonSplit;
      // If it's likely "Last, First; Last, First" already handled above. For comma-separated with initials, group pairs when possible is complex.
      // As a pragmatic fallback, split on ' , ' only when it looks like 'First Last, First Last'
      if (authors.includes(';')) return authors.split(';').map(s => s.trim()).filter(Boolean);
      // Common case from Veritus is 'A. Smith, B. Johnson' — split by comma then rejoin tokens into names by heuristic of two-token groups
      const parts = authors.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length <= 1) return parts;
      // Heuristic: if many short tokens, keep as simple list
      return parts;
    };

    const results = (raw.data as any[]).map((p) => ({
      title: p.title,
      authors: parseAuthors(p.authors),
      abstract: p.abstract ?? undefined,
      publicationDate: p.publishedAt || (p.year ? `${p.year}-01-01` : undefined),
      doi: p.doi ?? undefined,
      arxivId: undefined,
      citations: p.impactFactor?.citationCount ?? undefined,
      sourceUrl: p.link || p.titleLink || p.semanticLink || undefined,
      relevanceScore: p.score ?? undefined,
    }));

    return {
      jobId: raw.job.id,
      status: 'completed',
      results,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();

    // Try our internal schema first; if it fails, try to normalize real Veritus payload
    let normalized = null as ReturnType<typeof normalizeVeritusPayload> | null;
    let parsed: z.infer<typeof callbackSchema> | null = null;

    if (raw && typeof raw === 'object' && 'jobId' in raw) {
      parsed = callbackSchema.parse(raw);
    } else {
      normalized = normalizeVeritusPayload(raw);
      if (!normalized) {
        // If it still doesn't match, surface a validation error
        parsed = callbackSchema.parse(raw); // will throw
      }
    }

    const { jobId, status, results, error } = parsed ?? (normalized as any);

    // Find the job in database
    const [job] = await db
      .select()
      .from(veritusJobs)
      .where(eq(veritusJobs.jobId, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Update job status
    const now = new Date().toISOString();
    await db
      .update(veritusJobs)
      .set({
        status: status === 'completed' ? 'completed' : 'failed',
        updatedAt: now,
      })
      .where(eq(veritusJobs.id, job.id));

    if (status === 'failed') {
      console.error(`Veritus job ${jobId} failed:`, error);
      
      // Update concept status
      await db
        .update(concepts)
        .set({
          status: 'failed',
          updatedAt: now,
        })
        .where(eq(concepts.id, job.conceptId));

      return NextResponse.json({
        success: true,
        message: "Job failure recorded",
      });
    }

    // Store papers in database
    if (results && results.length > 0) {
      const paperInserts = results.map((paper: any) => ({
        veritusJobId: job.id,
        title: paper.title,
        authors: JSON.stringify(paper.authors || []),
        abstract: paper.abstract || null,
        publicationDate: paper.publicationDate || null,
        doi: paper.doi || null,
        arxivId: paper.arxivId || null,
        citations: paper.citations || 0,
        sourceUrl: paper.sourceUrl || null,
        relevanceScore: paper.relevanceScore || 0.5,
        createdAt: now,
      }));

      await db.insert(papers).values(paperInserts);
    }

    // Check if all jobs for this concept are completed
    const allJobs = await db
      .select()
      .from(veritusJobs)
      .where(eq(veritusJobs.conceptId, job.conceptId));

    const allCompleted = allJobs.every(
      (j) => j.status === 'completed' || j.status === 'failed'
    );

    if (allCompleted) {
      // Get concept details
      const [concept] = await db
        .select()
        .from(concepts)
        .where(eq(concepts.id, job.conceptId))
        .limit(1);

      if (!concept) {
        throw new Error("Concept not found");
      }

      // Get all papers for this concept
      const allPapers = await db
        .select({
          id: papers.id,
          title: papers.title,
          authors: papers.authors,
          abstract: papers.abstract,
          publicationDate: papers.publicationDate,
          doi: papers.doi,
          arxivId: papers.arxivId,
          citations: papers.citations,
          sourceUrl: papers.sourceUrl,
          relevanceScore: papers.relevanceScore,
        })
        .from(papers)
        .innerJoin(veritusJobs, eq(papers.veritusJobId, veritusJobs.id))
        .where(eq(veritusJobs.conceptId, job.conceptId));

      if (allPapers.length > 0) {
        // Trigger Agent 4: Provenance Agent (use HTTP for internal calls in development)
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? request.nextUrl.origin 
          : 'http://localhost:3000';
        
        const provenanceResponse = await fetch(
          `${baseUrl}/api/agents/provenance`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refinedConcept: concept.refinedConcept || concept.originalConcept,
              papers: allPapers.map(p => ({
                ...p,
                authors: JSON.parse(p.authors as string),
              })),
            }),
          }
        );

        if (!provenanceResponse.ok) {
          throw new Error("Provenance agent failed");
        }

        const provenanceData = await provenanceResponse.json();
        const { lineageGraph } = provenanceData.data;

        // Store lineage in database
        if (lineageGraph && lineageGraph.length > 0) {
          const lineageInserts = lineageGraph.map((node: any) => ({
            conceptId: job.conceptId,
            paperId: node.paperId,
            ancestorPaperId: node.ancestorPaperId,
            mutationType: node.mutationType,
            mutationDescription: node.mutationDescription,
            era: node.era,
            influenceScore: node.influenceScore,
            positionX: Math.random() * 800 - 400, // Will be recalculated by D3
            positionY: Math.random() * 600 - 300,
            createdAt: now,
          }));

          await db.insert(lineage).values(lineageInserts);
        }

        // Trigger Agent 5: Narrative Agent
        const narrativeResponse = await fetch(
          `${baseUrl}/api/agents/narrative`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refinedConcept: concept.refinedConcept || concept.originalConcept,
              lineageGraph,
              papers: allPapers.map(p => ({
                id: p.id,
                title: p.title,
                authors: JSON.parse(p.authors as string),
                publicationDate: p.publicationDate,
              })),
            }),
          }
        );

        if (!narrativeResponse.ok) {
          throw new Error("Narrative agent failed");
        }

        const narrativeData = await narrativeResponse.json();
        const { fullNarrative, summary, keyInsights } = narrativeData.data;

        // Store narrative in database
        await db.insert(narratives).values({
          conceptId: job.conceptId,
          fullNarrative,
          summary: summary || '',
          keyInsights: JSON.stringify(keyInsights || []),
          createdAt: now,
        });

        // Update concept status to completed
        await db
          .update(concepts)
          .set({
            status: 'completed',
            updatedAt: now,
          })
          .where(eq(concepts.id, job.conceptId));
      } else {
        // No papers returned – mark concept as completed so UI doesn't stay stuck in processing
        await db
          .update(concepts)
          .set({
            status: 'completed',
            updatedAt: now,
          })
          .where(eq(concepts.id, job.conceptId));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
    });
  } catch (error) {
    console.error("Veritus callback error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid callback payload", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process callback" },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: "Linea Veritus Callback",
    status: "ready",
  });
}