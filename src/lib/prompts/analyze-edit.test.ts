import { describe, it, expect } from "vitest";
import { buildAnalyzeEditPrompt } from "@/lib/prompts/analyze-edit";

describe("buildAnalyzeEditPrompt", () => {
  it("prompt 包含原始和修改後文案", () => {
    const prompt = buildAnalyzeEditPrompt("threads", "原始文案", "修改後文案");

    expect(prompt).toContain("原始文案");
    expect(prompt).toContain("修改後文案");
    expect(prompt).toContain("threads");
  });

  it("prompt 要求回傳 JSON 格式的風格建議", () => {
    const prompt = buildAnalyzeEditPrompt("threads", "A", "B");

    expect(prompt).toContain("JSON");
    expect(prompt).toContain("dimension");
    expect(prompt).toContain("original");
    expect(prompt).toContain("suggested");
  });
});
