import { describe, it, expect } from "vitest";
import {
  REQUIRED_DIMENSION_KEYS,
  DIMENSION_LABELS,
} from "@/lib/types";
import type { StyleDimensions } from "@/lib/types";

describe("StyleDimensions 型別與常數", () => {
  it("REQUIRED_DIMENSION_KEYS 包含恰好 7 個必填 key", () => {
    expect(REQUIRED_DIMENSION_KEYS).toHaveLength(7);
    expect(REQUIRED_DIMENSION_KEYS).toContain("structure_pattern");
    expect(REQUIRED_DIMENSION_KEYS).toContain("hook_pattern");
    expect(REQUIRED_DIMENSION_KEYS).toContain("tone_features");
    expect(REQUIRED_DIMENSION_KEYS).toContain("cta_pattern");
    expect(REQUIRED_DIMENSION_KEYS).toContain("format_specs");
    expect(REQUIRED_DIMENSION_KEYS).toContain("high_engagement_features");
    expect(REQUIRED_DIMENSION_KEYS).toContain("taboos");
  });

  it("DIMENSION_LABELS 為每個必填 key 提供中文標籤", () => {
    for (const key of REQUIRED_DIMENSION_KEYS) {
      expect(DIMENSION_LABELS[key]).toBeDefined();
      expect(typeof DIMENSION_LABELS[key]).toBe("string");
      expect(DIMENSION_LABELS[key].length).toBeGreaterThan(0);
    }
  });

  it("StyleDimensions 允許自訂 key（compile-time 驗證）", () => {
    const dims: StyleDimensions = {
      structure_pattern: "test",
      hook_pattern: "test",
      tone_features: "test",
      cta_pattern: "test",
      format_specs: "test",
      high_engagement_features: "test",
      taboos: "test",
      custom_field: "this should be allowed",
    };
    expect(dims.custom_field).toBe("this should be allowed");
  });
});
