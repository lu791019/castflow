import { getAnthropicClient } from "./client";
import {
  buildSystemPrompt,
  buildMultiPlatformPrompt,
  buildSinglePlatformPrompt,
} from "@/lib/prompts/generate-content";
import { Platform } from "@/lib/types";

const MODEL = "claude-sonnet-4-20250514";

export async function generateAllPlatforms(
  transcript: string,
): Promise<Record<Platform, string>> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildMultiPlatformPrompt(transcript) }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

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
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildSinglePlatformPrompt(transcript, platform),
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
