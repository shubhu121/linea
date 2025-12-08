import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredOutput } from "@/lib/gemini";

const paperSchema = z.object({
  id: z.number(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  abstract: z.string().nullable().default(""),
  publicationDate: z.string().optional(),
  citations: z.number().optional(),
});

const requestSchema = z.object({
  refinedConcept: z.string(),
  papers: z.array(paperSchema),
});

const lineageNodeSchema = z.object({
  paperId: z.number().catch(0).default(0),
  ancestorPaperId: z.union([z.number(), z.array(z.number()), z.null(), z.undefined()])
    .transform(val => {
      // Handle arrays by taking first element
      if (Array.isArray(val)) {
        return val.length > 0 ? val[0] : null;
      }
      // Handle undefined
      if (val === undefined) {
        return null;
      }
      return val;
    })
    .catch(null)
    .default(null),
  mutationType: z.enum(["origin", "refinement", "synthesis", "application", "critique"]).catch("refinement").default("refinement"),
  mutationDescription: z.string().catch("").default(""),
  era: z.string().catch("Modern").default("Modern"),
  influenceScore: z.number().min(0).max(1).catch(0.5).default(0.5),
});

const eraSchema = z.object({
  name: z.string().catch("").default(""),
  dateRange: z.string().catch("").default(""),
  characteristics: z.string().catch("").default(""),
});

const transitionSchema = z.object({
  fromPaperId: z.number().catch(0).default(0),
  toPaperId: z.number().catch(0).default(0),
  transitionType: z.string().catch("transition").default("transition"),
  significance: z.string().catch("").default(""),
});

const responseSchema = z.object({
  lineageGraph: z.array(lineageNodeSchema).catch([]).default([]),
  eras: z.array(eraSchema).catch([]).default([]),
  keyTransitions: z.array(transitionSchema).catch([]).default([]),
  provenanceNotes: z.string().catch("").default(""),
});

type ProvenanceAgentResponse = z.infer<typeof responseSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refinedConcept, papers } = requestSchema.parse(body);

    if (papers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          lineageGraph: [],
          eras: [],
          keyTransitions: [],
          provenanceNotes: "No papers provided for analysis.",
        },
      });
    }

    const systemInstruction = `You are the Provenance Agent for Linea, a Research Provenance Engine.
Your role is to analyze papers and construct the conceptual lineage graph showing how ideas evolved over time.

Analyze the papers and create:
1. lineageGraph: Array of nodes with paperId, ancestorPaperId (parent in lineage), mutationType (origin/refinement/synthesis/application/critique), mutationDescription, era, influenceScore (0-1)
2. eras: Temporal groupings with names, date ranges, and characteristics
3. keyTransitions: Important connections between papers showing conceptual shifts
4. provenanceNotes: Overview of how this concept evolved

CRITICAL RULES:
- ancestorPaperId must be a SINGLE NUMBER (the paper ID) or null. NOT an array.
- Each paper can have at most ONE direct ancestor in the lineage graph.
- If a paper builds on multiple papers, choose the most influential one as the ancestor.
- ALL fields must be populated - no null, undefined, or empty strings for required fields.
- influenceScore must be between 0 and 1.

Mutation types:
- origin: Foundational/first paper on this idea
- refinement: Improves/clarifies an existing idea
- synthesis: Combines multiple ideas
- application: Applies idea to new domain
- critique: Challenges/revises an idea

Build a clear ancestor-descendant graph structure.`;

    const papersText = papers
      .map(
        (p) =>
          `[ID: ${p.id}] ${p.title}
Authors: ${p.authors?.join(", ") || "N/A"}
Year: ${p.publicationDate || "N/A"}
Citations: ${p.citations || 0}
Abstract: ${p.abstract?.substring(0, 300) || "N/A"}...`
      )
      .join("\n\n---\n\n");

    const prompt = `Analyze these papers and construct the provenance lineage for: "${refinedConcept}"

Papers:
${papersText}

Build the conceptual lineage graph showing how this idea emerged and evolved through these papers.

IMPORTANT: ancestorPaperId must be a single number or null, NOT an array.`;

    const result = await generateStructuredOutput<ProvenanceAgentResponse>(
      prompt,
      systemInstruction
    );

    const validatedResult = responseSchema.parse(result);

    // Fallback: If no lineage graph, create basic nodes
    if (validatedResult.lineageGraph.length === 0 && papers.length > 0) {
      validatedResult.lineageGraph = papers.map((p, idx) => ({
        paperId: p.id,
        ancestorPaperId: idx === 0 ? null : papers[idx - 1].id,
        mutationType: idx === 0 ? "origin" as const : "refinement" as const,
        mutationDescription: `Analysis of ${p.title}`,
        era: "Modern",
        influenceScore: 0.5,
      }));
    }

    return NextResponse.json({
      success: true,
      data: validatedResult,
    });
  } catch (error) {
    console.error("Provenance Agent error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to analyze provenance" },
      { status: 500 }
    );
  }
}