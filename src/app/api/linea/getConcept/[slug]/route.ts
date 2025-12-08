import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { concepts, narratives } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth, verifyConceptOwnership, getSecurityHeaders, isValidSlug } from "@/lib/security";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Input validation
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { success: false, error: "Invalid concept slug format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Authenticate user
    const user = await verifyAuth(request);

    // Verify ownership - this ensures user can only access their own concepts
    const concept = await verifyConceptOwnership(slug, user.userId);

    // Get full concept data
    const [fullConcept] = await db
      .select()
      .from(concepts)
      .where(eq(concepts.id, concept.id))
      .limit(1);

    if (!fullConcept) {
      return NextResponse.json(
        { success: false, error: "Concept not found" },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    // Get narrative if completed
    let narrative = null;
    if (fullConcept.status === "completed") {
      const [narrativeData] = await db
        .select()
        .from(narratives)
        .where(eq(narratives.conceptId, fullConcept.id))
        .limit(1);

      if (narrativeData) {
        narrative = {
          fullNarrative: narrativeData.fullNarrative,
          summary: narrativeData.summary,
          keyInsights: JSON.parse(narrativeData.keyInsights as string),
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          concept: {
            id: fullConcept.id,
            slug: fullConcept.slug,
            originalConcept: fullConcept.originalConcept,
            refinedConcept: fullConcept.refinedConcept,
            status: fullConcept.status,
            createdAt: fullConcept.createdAt,
            updatedAt: fullConcept.updatedAt,
          },
          narrative,
        },
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Get concept error:", error);

    // Return appropriate error based on type
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized") || error.message.includes("Invalid") || error.message.includes("expired")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401, headers: getSecurityHeaders() }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to retrieve concept" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}