import { runClaudePrint } from "./client";
import { buildExtractStylePrompt } from "@/lib/prompts/extract-style";
import { StyleDimensions, REQUIRED_DIMENSION_KEYS } from "@/lib/types";

export async function extractStyleDna(
  platform: string,
  examples: { content: string; likes?: number; comments?: number; shares?: number }[],
  customDimensionNames?: string[],
): Promise<StyleDimensions> {
  const prompt = buildExtractStylePrompt(platform, examples, customDimensionNames);
  const text = await runClaudePrint(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse style DNA: no JSON found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as StyleDimensions;

  // Validate only required dimensions
  for (const key of REQUIRED_DIMENSION_KEYS) {
    if (!parsed[key]) {
      throw new Error(`Missing dimension: ${key}`);
    }
  }

  return parsed;
}
