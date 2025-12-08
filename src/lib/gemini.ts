import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required. Please set it in your .env file.');
}

let ai: GoogleGenAI;

try {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} catch (e) {
  throw new Error(`Failed to initialize Gemini client: ${e}`);
}

export async function generateStructuredOutput<T>(
  prompt: string,
  systemInstruction?: string,
  model: string = "gemini-2.0-flash-exp"
): Promise<T> {
  try {
    const strictJsonGuard = `\n\nSTRICT OUTPUT REQUIREMENTS:\n- Return ONLY a single valid JSON object.\n- No prose, no explanations, no markdown, no code fences.\n- Use double quotes for all keys and string values.\n- Do not include trailing commas.\n- Do not include comments.\n`;

    const fullPrompt = systemInstruction 
      ? `${systemInstruction}\n\n${prompt}${strictJsonGuard}`
      : `${prompt}${strictJsonGuard}`;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });
    const text: string = (response as any).text;

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to generate structured output: ${error}`);
  }
}

export async function generateText(
  prompt: string,
  systemInstruction?: string,
  model: string = "gemini-2.0-flash-exp"
): Promise<string> {
  try {
    const fullPrompt = systemInstruction 
      ? `${systemInstruction}\n\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });
    return (response as any).text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to generate text: ${error}`);
  }
}

export { ai };