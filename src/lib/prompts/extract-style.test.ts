import { describe, it, expect } from "vitest";
import { buildExtractStylePrompt } from "@/lib/prompts/extract-style";

const MOCK_EXAMPLES = [
  { content: "範例文案 1" },
  { content: "範例文案 2" },
  { content: "範例文案 3" },
];

describe("buildExtractStylePrompt", () => {
  it("無自訂維度時 prompt 包含 7 必填維度的 JSON key", () => {
    const prompt = buildExtractStylePrompt("threads", MOCK_EXAMPLES);

    expect(prompt).toContain("structure_pattern");
    expect(prompt).toContain("hook_pattern");
    expect(prompt).toContain("tone_features");
    expect(prompt).toContain("cta_pattern");
    expect(prompt).toContain("format_specs");
    expect(prompt).toContain("high_engagement_features");
    expect(prompt).toContain("taboos");
  });

  it("無自訂維度時 prompt 不包含自訂維度", () => {
    const prompt = buildExtractStylePrompt("threads", MOCK_EXAMPLES);

    // Should not contain any custom dimension instruction
    expect(prompt).not.toContain("自訂維度");
  });

  it("有自訂維度時 prompt 包含必填 + 自訂維度的 JSON key", () => {
    const customNames = ["常用句型", "開場白模式"];
    const prompt = buildExtractStylePrompt("threads", MOCK_EXAMPLES, customNames);

    // Required dimensions still present
    expect(prompt).toContain("structure_pattern");
    expect(prompt).toContain("taboos");

    // Custom dimensions included in prompt
    expect(prompt).toContain("常用句型");
    expect(prompt).toContain("開場白模式");
  });
});
