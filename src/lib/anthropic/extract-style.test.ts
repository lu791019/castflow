import { describe, it, expect, vi } from "vitest";

// Mock runClaudePrint before importing extractStyleDna
vi.mock("@/lib/anthropic/client", () => ({
  runClaudePrint: vi.fn(),
}));

import { extractStyleDna } from "@/lib/anthropic/extract-style";
import { runClaudePrint } from "@/lib/anthropic/client";

const MOCK_EXAMPLES = [
  { content: "範例 1" },
  { content: "範例 2" },
  { content: "範例 3" },
];

const FULL_RESPONSE = JSON.stringify({
  structure_pattern: "Hook → 條列 → 金句",
  hook_pattern: "反差型提問",
  tone_features: "口語化",
  cta_pattern: "問題結尾",
  format_specs: "300-500 字",
  high_engagement_features: "故事 + 數據",
  taboos: "不推銷",
});

const FULL_WITH_CUSTOM = JSON.stringify({
  structure_pattern: "Hook → 條列 → 金句",
  hook_pattern: "反差型提問",
  tone_features: "口語化",
  cta_pattern: "問題結尾",
  format_specs: "300-500 字",
  high_engagement_features: "故事 + 數據",
  taboos: "不推銷",
  常用句型: "我覺得...",
});

describe("extractStyleDna", () => {
  it("驗證 7 必填維度都在，回傳完整物件", async () => {
    vi.mocked(runClaudePrint).mockResolvedValue(FULL_RESPONSE);

    const result = await extractStyleDna("threads", MOCK_EXAMPLES);
    expect(result.structure_pattern).toBe("Hook → 條列 → 金句");
    expect(result.taboos).toBe("不推銷");
  });

  it("AI 回傳包含自訂維度時，驗證通過並保留自訂欄位", async () => {
    vi.mocked(runClaudePrint).mockResolvedValue(FULL_WITH_CUSTOM);

    const result = await extractStyleDna("threads", MOCK_EXAMPLES, ["常用句型"]);
    expect(result.structure_pattern).toBe("Hook → 條列 → 金句");
    expect(result["常用句型"]).toBe("我覺得...");
  });

  it("缺少必填維度時拋出錯誤", async () => {
    const missingHook = JSON.stringify({
      structure_pattern: "test",
      // hook_pattern missing
      tone_features: "test",
      cta_pattern: "test",
      format_specs: "test",
      high_engagement_features: "test",
      taboos: "test",
    });
    vi.mocked(runClaudePrint).mockResolvedValue(missingHook);

    await expect(extractStyleDna("threads", MOCK_EXAMPLES)).rejects.toThrow(
      "Missing dimension: hook_pattern",
    );
  });

  it("AI 回傳非 JSON 時拋出錯誤", async () => {
    vi.mocked(runClaudePrint).mockResolvedValue("這不是 JSON 格式");

    await expect(extractStyleDna("threads", MOCK_EXAMPLES)).rejects.toThrow(
      "Failed to parse style DNA",
    );
  });
});
