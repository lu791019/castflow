import { describe, it, expect } from "vitest";
import { buildStyleSection } from "@/lib/prompts/generate-content";
import type { StyleDimensions } from "@/lib/types";

const BASE_DIMENSIONS: StyleDimensions = {
  structure_pattern: "Hook → 條列 → 金句",
  hook_pattern: "反差型提問",
  tone_features: "口語化、第一人稱",
  cta_pattern: "問題結尾引發討論",
  format_specs: "300-500 字",
  high_engagement_features: "故事 + 數據",
  taboos: "不用推銷語氣",
};

describe("buildStyleSection", () => {
  it("無 styleDna 回傳空字串", () => {
    expect(buildStyleSection(undefined)).toBe("");
  });

  it("只有必填維度時輸出 7 行", () => {
    const result = buildStyleSection(BASE_DIMENSIONS);

    expect(result).toContain("結構模式");
    expect(result).toContain("開場 Hook");
    expect(result).toContain("語氣特徵");
    expect(result).toContain("CTA / 收尾");
    expect(result).toContain("長度 / 格式");
    expect(result).toContain("高互動特徵");
    expect(result).toContain("禁忌");
    expect(result).toContain("Hook → 條列 → 金句");
    expect(result).toContain("不用推銷語氣");
  });

  it("有自訂維度時輸出必填 + 自訂行", () => {
    const withCustom: StyleDimensions = {
      ...BASE_DIMENSIONS,
      常用句型: "我覺得...、換個角度看...",
    };
    const result = buildStyleSection(withCustom);

    // Required dimensions present
    expect(result).toContain("結構模式");
    expect(result).toContain("禁忌");

    // Custom dimension present
    expect(result).toContain("常用句型");
    expect(result).toContain("我覺得...、換個角度看...");
  });
});
