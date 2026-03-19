import { runClaudePrint } from "./client";
import {
  buildSystemPrompt,
  buildMultiPlatformPrompt,
  buildSinglePlatformPrompt,
} from "@/lib/prompts/generate-content";
import { Platform, StyleDimensions } from "@/lib/types";

export async function generateAllPlatforms(
  transcript: string,
  styleDna?: StyleDimensions,
): Promise<Record<Platform, string>> {
  const prompt = `${buildSystemPrompt()}\n\n${buildMultiPlatformPrompt(transcript, styleDna)}`;
  const text = await runClaudePrint(prompt);

  // Extract JSON from response (handles possible markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse generated content: no JSON found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;

  // Validate all platforms are present
  const platforms: Platform[] = [
    "threads",
    "facebook",
    "instagram",
    "linkedin",
    "blog",
    "newsletter",
  ];
  for (const p of platforms) {
    if (!parsed[p]) {
      throw new Error(`Missing content for platform: ${p}`);
    }
  }

  return parsed as Record<Platform, string>;
}

export async function generateSinglePlatform(
  transcript: string,
  platform: Platform,
  styleDna?: StyleDimensions,
): Promise<string> {
  const prompt = `${buildSystemPrompt()}\n\n${buildSinglePlatformPrompt(transcript, platform, styleDna)}`;
  return runClaudePrint(prompt);
}
