import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredOutput } from "@/lib/gemini";

const requestSchema = z.object({
  refinedConcept: z.string(),
  phrases: z.array(
    z.object({
      phrase: z.string(),
      rationale: z.string(),
      expectedYield: z.enum(["high", "medium", "low"]),
      temporalFocus: z.string(),
    })
  ),
});

const priorityItemSchema = z.object({
  phrase: z.string().catch("").default(""),
  priority: z.number().catch(1).default(1),
  reasoning: z.string().catch("").default(""),
});

const responseSchema = z.object({
  selectedPhrases: z.array(z.string()).catch([]).default([]),
  searchParameters: z.object({
    maxResultsPerPhrase: z.number().catch(10).default(10),
    dateRangeStart: z.string().nullable().optional(),
    dateRangeEnd: z.string().nullable().optional(),
    includePreprints: z.boolean().catch(true).default(true),
    citationThreshold: z.number().nullable().optional(),
  }).catch({
    maxResultsPerPhrase: 10,
    dateRangeStart: null,
    dateRangeEnd: null,
    includePreprints: true,
    citationThreshold: null,
  }).default({
    maxResultsPerPhrase: 10,
    dateRangeStart: null,
    dateRangeEnd: null,
    includePreprints: true,
    citationThreshold: null,
  }),
  priorityRanking: z.array(priorityItemSchema).catch([]).default([]),
  strategyNotes: z.string().catch("").default(""),
});

type StrategyAgentResponse = z.infer<typeof responseSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refinedConcept, phrases } = requestSchema.parse(body);

    const systemInstruction = `You are the Strategy Agent for Linea, a Research Provenance Engine.
Your role is to determine the optimal search strategy for retrieving papers that trace conceptual lineage.

Analyze the phrases and create a search strategy that:
1. Selects the most effective phrases (prioritize 3-5 top phrases)
2. Defines search parameters (max results, date ranges, citation thresholds)
3. Ranks phrases by priority for execution
4. Balances breadth (discovering origins) with depth (tracing evolution)
5. Considers computational efficiency

CRITICAL: All fields must be populated. selectedPhrases must contain at least 3 phrases.

Output: selectedPhrases (array), searchParameters (object), priorityRanking (array with phrase/priority/reasoning), strategyNotes`;

    const prompt = `Create an optimal search strategy for this concept:

Refined Concept: ${refinedConcept}

Available Phrases:
${phrases.map((p, i) => `${i + 1}. "${p.phrase}" (Expected: ${p.expectedYield}, Focus: ${p.temporalFocus})\n   Rationale: ${p.rationale}`).join("\n")}

Determine the best search strategy to trace the provenance of this concept efficiently.`;

    const result = await generateStructuredOutput<StrategyAgentResponse>(
      prompt,
      systemInstruction
    );

    const validatedResult = responseSchema.parse(result);

    // Fallback: If no phrases selected, use all available phrases
    if (validatedResult.selectedPhrases.length === 0) {
      validatedResult.selectedPhrases = phrases.slice(0, 5).map(p => p.phrase);
    }

    return NextResponse.json({
      success: true,
      data: validatedResult,
    });
  } catch (error) {
    console.error("Strategy Agent error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate search strategy" },
      { status: 500 }
    );
  }
}