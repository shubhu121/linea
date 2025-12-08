import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { concepts, lineage, papers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
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

    // Verify ownership - ensures user can only access their own concept's lineage
    const concept = await verifyConceptOwnership(slug, user.userId);

    // Get lineage nodes
    const lineageNodes = await db
      .select({
        id: lineage.id,
        paperId: lineage.paperId,
        ancestorPaperId: lineage.ancestorPaperId,
        mutationType: lineage.mutationType,
        mutationDescription: lineage.mutationDescription,
        era: lineage.era,
        influenceScore: lineage.influenceScore,
        positionX: lineage.positionX,
        positionY: lineage.positionY,
        createdAt: lineage.createdAt,
      })
      .from(lineage)
      .where(eq(lineage.conceptId, concept.id));

    // Get all papers referenced in lineage
    const paperIds = Array.from(
      new Set(lineageNodes.map((n) => n.paperId))
    );

    const papersData = await db
      .select()
      .from(papers)
      .where(
        inArray(
          papers.id,
          paperIds.length > 0 ? paperIds : [0]
        )
      );

    const papersMap = papersData.reduce((acc: any, paper) => {
      acc[paper.id] = {
        id: paper.id,
        title: paper.title,
        authors: JSON.parse(paper.authors as string),
        abstract: paper.abstract,
        publicationDate: paper.publicationDate,
        doi: paper.doi,
        arxivId: paper.arxivId,
        citations: paper.citations,
        sourceUrl: paper.sourceUrl,
        relevanceScore: paper.relevanceScore,
      };
      return acc;
    }, {});

    // Build graph structure for D3
    const nodes = lineageNodes.map((node) => ({
      id: node.paperId,
      paper: papersMap[node.paperId],
      mutationType: node.mutationType,
      mutationDescription: node.mutationDescription,
      era: node.era,
      influenceScore: node.influenceScore,
    }));

    const links = lineageNodes
      .filter((node) => node.ancestorPaperId !== null)
      .map((node) => ({
        source: node.ancestorPaperId,
        target: node.paperId,
        type: node.mutationType,
      }));

    return NextResponse.json(
      {
        success: true,
        data: {
          nodes,
          links,
          papers: papersMap,
        },
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Get lineage error:", error);

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
      { success: false, error: "Failed to retrieve lineage" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}