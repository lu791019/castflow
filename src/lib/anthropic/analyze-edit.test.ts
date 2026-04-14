import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/anthropic/client", () => ({
  runClaudePrint: vi.fn(),
}));

import { analyzeEditDiff } from "@/lib/anthropic/analyze-edit";
import { runClaudePrint } from "@/lib/anthropic/client";

describe("analyzeEditDiff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("回傳風格建議陣列", async () => {
    const mockResponse = JSON.stringify([
      {
        dimension: "tone_features",
        original: "正式語氣",
        suggested: "口語化、親切",
        reason: "用戶將正式用語改為口語",
      },
      {
        dimension: "hook_pattern",
        original: "數據開場",
        suggested: "故事開場",
        reason: "用戶將數據替換為故事",
      },
    ]);
    vi.mocked(runClaudePrint).mockResolvedValue(mockResponse);

    const result = await analyzeEditDiff("threads", "原始", "修改");
    expect(result).toHaveLength(2);
    expect(result[0].dimension).toBe("tone_features");
    expect(result[0].suggested).toBe("口語化、親切");
    expect(result[1].dimension).toBe("hook_pattern");
  });

  it("無實質差異回傳空陣列，不呼叫 AI", async () => {
    const result = await analyzeEditDiff("threads", "相同文案", "相同文案");
    expect(result).toEqual([]);
    expect(runClaudePrint).not.toHaveBeenCalled();
  });

  it("AI 回傳非 JSON 時拋出錯誤", async () => {
    vi.mocked(runClaudePrint).mockResolvedValue("非 JSON 回傳");

    await expect(analyzeEditDiff("threads", "A", "B")).rejects.toThrow(
      "Failed to parse edit analysis",
    );
  });
});
