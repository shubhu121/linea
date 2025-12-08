import { z } from "zod";
import { generateStructuredOutput } from "@/lib/gemini";

// Concept Agent Response Schema
const conceptAgentResponseSchema = z.object({
  refinedConcept: z.string(),
  keyEntities: z.array(z.string()),
  temporalScope: z.string(),
  disciplinaryContext: z.array(z.string()),
  reasoning: z.string(),
});

export type ConceptAgentResponse = z.infer<typeof conceptAgentResponseSchema>;

// Phrase Agent Response Schema
const phraseAgentResponseSchema = z.object({
  phrases: z.array(
    z.object({
      phrase: z.string(),
      rationale: z.string(),
      expectedYield: z.enum(["high", "medium", "low"]),
      temporalFocus: z.string(),
    })
  ),
});

export type PhraseAgentResponse = z.infer<typeof phraseAgentResponseSchema>;

// Strategy Agent Response Schema
const strategyAgentResponseSchema = z.object({
  selectedPhrases: z.array(z.string()),
  searchParameters: z.object({
    maxResultsPerPhrase: z.number(),
    dateRangeStart: z.string().nullable().optional(),
    dateRangeEnd: z.string().nullable().optional(),
    includePreprints: z.boolean(),
    citationThreshold: z.number().nullable().optional(),
  }),
  priorityRanking: z.array(
    z.object({
      phrase: z.string(),
      priority: z.number(),
      reasoning: z.string(),
    })
  ),
  strategyNotes: z.string(),
});

export type StrategyAgentResponse = z.infer<typeof strategyAgentResponseSchema>;

/**
 * Concept Agent - Refines user-provided concepts into precise definitions
 */
export async function runConceptAgent(concept: string): Promise<ConceptAgentResponse> {
  const systemInstruction = `You are the Concept Agent for Linea, a Research Provenance Engine.
Your role is to refine user-provided research concepts into precise, academically grounded definitions suitable for provenance tracing.

Analyze the concept and provide:
1. A refined, scholarly definition of the concept
2. Key entities, theories, or figures central to this concept
3. Temporal scope (when this concept emerged/evolved)
4. Disciplinary context (fields where this concept is studied)
5. Reasoning for your refinement

Output as JSON with fields: refinedConcept, keyEntities (array), temporalScope, disciplinaryContext (array), reasoning`;

  const prompt = `Refine this research concept for provenance analysis:\n\n"${concept}"\n\nProvide a structured analysis.`;

  const result = await generateStructuredOutput<ConceptAgentResponse>(
    prompt,
    systemInstruction
  );

  return conceptAgentResponseSchema.parse(result);
}

/**
 * Phrase Agent - Generates targeted search phrases
 */
export async function runPhraseAgent(
  refinedConcept: string,
  keyEntities: string[],
  disciplinaryContext: string[]
): Promise<PhraseAgentResponse> {
  const systemInstruction = `You are the Phrase Agent for Linea, a Research Provenance Engine.
Your role is to generate targeted search phrases that will retrieve papers tracing the origin and evolution of scientific concepts.

Generate 5-8 search phrases that:
1. Target foundational/seminal papers
2. Capture key terminology variations
3. Include influential researchers/theories
4. Span temporal evolution (early origins to modern)
5. Cover interdisciplinary connections

IMPORTANT: Return a JSON object with a "phrases" array property. Each phrase object should have: phrase, rationale, expectedYield (high/medium/low), temporalFocus.

Example format:
{
  "phrases": [
    { "phrase": "...", "rationale": "...", "expectedYield": "high", "temporalFocus": "..." }
  ]
}`;

  const prompt = `Generate search phrases for this refined concept:

Refined Concept: ${refinedConcept}
Key Entities: ${keyEntities.join(", ")}
Disciplinary Context: ${disciplinaryContext.join(", ")}

Create targeted search phrases for academic paper retrieval focused on provenance and lineage.

Return as a JSON object with a "phrases" array.`;

  const result = await generateStructuredOutput<PhraseAgentResponse | PhraseAgentResponse["phrases"]>(
    prompt,
    systemInstruction
  );

  // Handle case where Gemini returns array directly instead of object
  if (Array.isArray(result)) {
    return phraseAgentResponseSchema.parse({ phrases: result });
  }

  return phraseAgentResponseSchema.parse(result);
}

/**
 * Strategy Agent - Optimizes search strategy
 */
export async function runStrategyAgent(
  refinedConcept: string,
  phrases: PhraseAgentResponse["phrases"]
): Promise<StrategyAgentResponse> {
  const systemInstruction = `You are the Strategy Agent for Linea, a Research Provenance Engine.
Your role is to determine the optimal search strategy for retrieving papers that trace conceptual lineage.

Analyze the phrases and create a search strategy that:
1. Selects the most effective phrases (MUST SELECT AT LEAST 3 PHRASES, ideally 3-6 phrases)
2. Defines search parameters (max results per phrase must be 100, 200, or 300)
3. Ranks phrases by priority for execution
4. Balances breadth (discovering origins) with depth (tracing evolution)
5. Considers computational efficiency

CRITICAL REQUIREMENTS:
- selectedPhrases array MUST contain at least 3 phrases (Veritus API requirement)
- maxResultsPerPhrase MUST be exactly 100, 200, or 300 (no other values allowed)
- dateRangeStart and dateRangeEnd MUST be in YYYY format only (e.g., "2015", "2020") - NOT full dates
- If providing date ranges, use 4-digit years only

IMPORTANT: searchParameters object MUST include:
- maxResultsPerPhrase (number: 100, 200, or 300 ONLY)
- includePreprints (boolean, e.g., true)
- dateRangeStart (optional string in YYYY format, e.g., "2010")
- dateRangeEnd (optional string in YYYY format, e.g., "2020")
- citationThreshold (optional number)

Output: selectedPhrases (array with at least 3 items), searchParameters (object with all required fields), priorityRanking (array with phrase/priority/reasoning), strategyNotes`;

  const prompt = `Create an optimal search strategy for this concept:

Refined Concept: ${refinedConcept}

Available Phrases:
${phrases.map((p, i) => `${i + 1}. "${p.phrase}" (Expected: ${p.expectedYield}, Focus: ${p.temporalFocus})\n   Rationale: ${p.rationale}`).join("\n")}

CRITICAL: You MUST select at least 3 phrases for the search (Veritus API requirement).
CRITICAL: maxResultsPerPhrase must be exactly 100, 200, or 300.

Determine the best search strategy to trace the provenance of this concept efficiently.`;

  const result = await generateStructuredOutput<StrategyAgentResponse>(
    prompt,
    systemInstruction
  );

  // Provide defaults and ensure requirements are met
  const parsed = strategyAgentResponseSchema.parse({
    ...result,
    searchParameters: {
      maxResultsPerPhrase: 100, // Default to 100 (valid Veritus value)
      includePreprints: true,
      ...result.searchParameters,
      // Ensure maxResultsPerPhrase is valid (100, 200, or 300)
      maxResultsPerPhrase: [100, 200, 300].includes(result.searchParameters?.maxResultsPerPhrase || 0)
        ? result.searchParameters.maxResultsPerPhrase
        : 100,
    },
  });

  // Ensure at least 3 phrases are selected (Veritus requirement)
  if (parsed.selectedPhrases.length < 3) {
    // Add more phrases from the original list to meet minimum requirement
    const additionalPhrases = phrases
      .filter(p => !parsed.selectedPhrases.includes(p.phrase))
      .slice(0, 3 - parsed.selectedPhrases.length)
      .map(p => p.phrase);
    
    parsed.selectedPhrases = [...parsed.selectedPhrases, ...additionalPhrases];
  }

  return parsed;
}