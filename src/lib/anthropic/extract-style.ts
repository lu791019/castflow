import { runClaudePrint } from "./client";
import { buildExtractStylePrompt } from "@/lib/prompts/extract-style";
import { StyleDimensions } from "@/lib/types";

export async function extractStyleDna(
  platform: string,
  examples: { content: string; likes?: number; comments?: number; shares?: number }[],
): Promise<StyleDimensions> {
  const prompt = buildExtractStylePrompt(platform, examples);
  const text = await runClaudePrint(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse style DNA: no JSON found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as StyleDimensions;

  // Validate all dimensions present
  const required: (keyof StyleDimensions)[] = [
    "structure_pattern",
    "hook_pattern",
    "tone_features",
    "cta_pattern",
    "format_specs",
    "high_engagement_features",
    "taboos",
  ];
  for (const key of required) {
    if (!parsed[key]) {
      throw new Error(`Missing dimension: ${key}`);
    }
  }

  return parsed;
}
