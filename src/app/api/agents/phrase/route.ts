import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredOutput } from "@/lib/gemini";

const requestSchema = z.object({
  refinedConcept: z.string(),
  keyEntities: z.array(z.string()),
  disciplinaryContext: z.array(z.string()),
});

const phraseItemSchema = z.object({
  phrase: z.string().min(1).catch("search query").default("search query"),
  rationale: z.string().catch("").default(""),
  expectedYield: z.enum(["high", "medium", "low"]).catch("medium").default("medium"),
  temporalFocus: z.string().catch("").default(""),
});

const responseSchema = z.object({
  phrases: z.array(phraseItemSchema).catch([]).default([]),
});

type PhraseAgentResponse = z.infer<typeof responseSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refinedConcept, keyEntities, disciplinaryContext } = requestSchema.parse(body);

    const systemInstruction = `You are the Phrase Agent for Linea, a Research Provenance Engine.
Your role is to generate targeted search phrases that will retrieve papers tracing the origin and evolution of scientific concepts.

Generate 5-8 search phrases that:
1. Target foundational/seminal papers
2. Capture key terminology variations
3. Include influential researchers/theories
4. Span temporal evolution (early origins to modern)
5. Cover interdisciplinary connections

CRITICAL: Generate at least 5 phrases. Each phrase must have all fields populated (phrase, rationale, expectedYield, temporalFocus).

For each phrase provide: phrase, rationale, expectedYield (high/medium/low), temporalFocus`;

    const prompt = `Generate search phrases for this refined concept:

Refined Concept: ${refinedConcept}
Key Entities: ${keyEntities.join(", ")}
Disciplinary Context: ${disciplinaryContext.join(", ")}

Create targeted search phrases for academic paper retrieval focused on provenance and lineage.`;

    const result = await generateStructuredOutput<PhraseAgentResponse | PhraseAgentResponse["phrases"]>(
      prompt,
      systemInstruction
    );

    // Normalize Gemini's occasional array-only response into an object shape
    const normalizedResult = Array.isArray(result) ? { phrases: result } : result;

    const validatedResult = responseSchema.parse(normalizedResult);

    // Fallback: If no phrases generated, create a basic one
    if (validatedResult.phrases.length === 0) {
      validatedResult.phrases = [
        {
          phrase: refinedConcept,
          rationale: "Fallback search using refined concept",
          expectedYield: "medium" as const,
          temporalFocus: "general",
        },
      ];
    }

    return NextResponse.json({
      success: true,
      data: validatedResult,
    });
  } catch (error) {
    console.error("Phrase Agent error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate search phrases" },
      { status: 500 }
    );
  }
}