import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredOutput } from "@/lib/gemini";

const requestSchema = z.object({
  concept: z.string().min(3, "Concept must be at least 3 characters"),
});

const responseSchema = z.object({
  refinedConcept: z.string().min(1).catch("Unknown Concept"),
  keyEntities: z.array(z.string()).catch([]).default([]),
  temporalScope: z.string().catch("Unknown time period").default("Unknown time period"),
  disciplinaryContext: z.array(z.string()).catch([]).default([]),
  reasoning: z.string().catch("").default(""),
});

type ConceptAgentResponse = z.infer<typeof responseSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concept } = requestSchema.parse(body);

    const systemInstruction = `You are the Concept Agent for Linea, a Research Provenance Engine.
Your role is to refine user-provided research concepts into precise, academically grounded definitions suitable for provenance tracing.

Analyze the concept and provide:
1. A refined, scholarly definition of the concept
2. Key entities, theories, or figures central to this concept
3. Temporal scope (when this concept emerged/evolved)
4. Disciplinary context (fields where this concept is studied)
5. Reasoning for your refinement

CRITICAL: All fields must be populated. Do not return null, undefined, or empty strings for required fields.

Output as JSON with fields: refinedConcept, keyEntities (array), temporalScope, disciplinaryContext (array), reasoning`;

    const prompt = `Refine this research concept for provenance analysis:\n\n"${concept}"\n\nProvide a structured analysis.`;

    const result = await generateStructuredOutput<ConceptAgentResponse>(
      prompt,
      systemInstruction
    );

    // Validate response with fallbacks
    const validatedResult = responseSchema.parse(result);

    return NextResponse.json({
      success: true,
      data: validatedResult,
    });
  } catch (error) {
    console.error("Concept Agent error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to refine concept" },
      { status: 500 }
    );
  }
}