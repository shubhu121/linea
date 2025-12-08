import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredOutput } from "@/lib/gemini";

const lineageNodeSchema = z.object({
  paperId: z.number(),
  ancestorPaperId: z.number().nullable(),
  mutationType: z.enum(["origin", "refinement", "synthesis", "application", "critique"]),
  mutationDescription: z.string(),
  era: z.string(),
  influenceScore: z.number(),
});

const paperSchema = z.object({
  id: z.number(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  publicationDate: z.string().optional(),
});

const requestSchema = z.object({
  refinedConcept: z.string(),
  lineageGraph: z.array(lineageNodeSchema),
  papers: z.array(paperSchema),
});

const timelineItemSchema = z.object({
  era: z.string().catch("").default(""),
  year: z.string().catch("").default(""),
  event: z.string().catch("").default(""),
  significance: z.string().catch("").default(""),
});

const influentialFigureSchema = z.object({
  name: z.string().catch("").default(""),
  contribution: z.string().catch("").default(""),
});

const responseSchema = z.object({
  fullNarrative: z.string().min(1).catch("No narrative available.").default("No narrative available."),
  summary: z.string().min(1).catch("No summary available.").default("No summary available."),
  keyInsights: z.array(z.string()).catch([]).default([]),
  timeline: z.array(timelineItemSchema).catch([]).default([]),
  influentialFigures: z.array(influentialFigureSchema).catch([]).default([]),
});

type NarrativeAgentResponse = z.infer<typeof responseSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refinedConcept, lineageGraph, papers } = requestSchema.parse(body);

    if (lineageGraph.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          fullNarrative: "No lineage data available to generate narrative.",
          summary: "Insufficient data.",
          keyInsights: [],
          timeline: [],
          influentialFigures: [],
        },
      });
    }

    const systemInstruction = `You are the Narrative Agent for Linea, a Research Provenance Engine.
Your role is to weave the lineage graph into a compelling, scholarly narrative that tells the story of how this concept emerged and evolved.

Create:
1. fullNarrative: A rich 4-6 paragraph narrative tracing the concept's journey (scholarly but accessible)
2. summary: A concise 2-3 sentence overview
3. keyInsights: 3-5 important discoveries about this concept's evolution
4. timeline: Chronological events showing major milestones
5. influentialFigures: Key researchers and their contributions

CRITICAL: All fields must be populated. fullNarrative and summary must not be empty strings.

The narrative should:
- Follow chronological flow from origins to modern understanding
- Highlight key transitions and mutations
- Explain WHY ideas changed (not just WHAT changed)
- Connect to broader scientific/intellectual movements
- Be engaging and illuminate the "hidden story" behind the concept`;

    const lineageText = lineageGraph
      .map((node) => {
        const paper = papers.find((p) => p.id === node.paperId);
        const ancestor = node.ancestorPaperId
          ? papers.find((p) => p.id === node.ancestorPaperId)
          : null;

        return `Node: ${paper?.title || `Paper ${node.paperId}`} (${paper?.publicationDate || "Unknown"})
  Type: ${node.mutationType}
  Era: ${node.era}
  Influence: ${node.influenceScore}
  Builds on: ${ancestor?.title || "None (origin)"}
  Mutation: ${node.mutationDescription}`;
      })
      .join("\n\n");

    const prompt = `Create a narrative tracing the provenance of: "${refinedConcept}"

Lineage Graph:
${lineageText}

Weave this into a scholarly narrative that tells the story of how this concept emerged, evolved, and reached its current understanding.`;

    const result = await generateStructuredOutput<NarrativeAgentResponse>(
      prompt,
      systemInstruction
    );

    const validatedResult = responseSchema.parse(result);

    // Fallback: Ensure we have at least basic content
    if (!validatedResult.fullNarrative || validatedResult.fullNarrative.length < 50) {
      validatedResult.fullNarrative = `The concept of ${refinedConcept} has evolved through ${papers.length} significant research contributions. ` +
        `This lineage traces the development from foundational work to modern applications, showing how the concept has been refined, ` +
        `synthesized with other ideas, and applied across different domains.`;
    }

    if (!validatedResult.summary || validatedResult.summary.length < 20) {
      validatedResult.summary = `${refinedConcept} evolved through ${papers.length} research papers, showing progressive refinement and application.`;
    }

    return NextResponse.json({
      success: true,
      data: validatedResult,
    });
  } catch (error) {
    console.error("Narrative Agent error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
}