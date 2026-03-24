import { Platform, StyleDimensions } from "@/lib/types";

interface PlatformSpec {
  name: string;
  maxChars: number;
  guidelines: string;
}

export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  threads: {
    name: "Threads",
    maxChars: 500,
    guidelines:
      "500 字以內。簡短有力，開頭用 hook 抓住注意力，中間 1-2 個核心觀點，結尾 CTA。不使用 hashtag。",
  },
  facebook: {
    name: "Facebook",
    maxChars: 3000,
    guidelines:
      "1-3 段，說故事風格。開頭引人入勝，中間分享觀點或故事，結尾用互動問題引發討論。適當分段提升可讀性。",
  },
  instagram: {
    name: "Instagram",
    maxChars: 2200,
    guidelines:
      "Caption 風格，2200 字以內。適當使用 emoji 增加視覺效果，內容有價值感。結尾加 5-10 個相關 hashtag。",
  },
  linkedin: {
    name: "LinkedIn",
    maxChars: 3000,
    guidelines:
      "專業語調，分享洞見與學習。開頭用觀點或數據 hook，中間展開論述，結尾總結價值。使用條列式增加可讀性。",
  },
  blog: {
    name: "Blog",
    maxChars: 10000,
    guidelines:
      "長文 800-1500 字。包含標題、2-4 個小標題、結構化段落。深入展開 Podcast 的核心主題，提供實用建議。",
  },
  newsletter: {
    name: "Newsletter",
    maxChars: 5000,
    guidelines:
      "私人語調，像寫信給朋友。精選 Podcast 中 3-5 個重點，加入你的個人觀點。開頭親切問候，結尾預告下期或 CTA。",
  },
};

export const ALL_PLATFORMS: Platform[] = [
  "threads",
  "facebook",
  "instagram",
  "linkedin",
  "blog",
  "newsletter",
];

export function buildSystemPrompt(): string {
  return `你是一位專業的社群內容策略師，擅長將 Podcast 逐字稿轉化為各平台的高品質社群文案。

核心原則：
- 所有內容使用繁體中文
- 從逐字稿中提取最有價值的觀點和故事
- 根據各平台的特性調整語氣和格式
- 內容要有原創性，不是單純摘要，而是重新詮釋
- 每個平台的內容應該獨立完整，不互相依賴`;
}

function buildStyleSection(styleDna?: StyleDimensions): string {
  if (!styleDna) return "";

  return `
## 風格 DNA（請嚴格遵循以下風格模式）
- 結構模式：${styleDna.structure_pattern}
- 開場 Hook：${styleDna.hook_pattern}
- 語氣特徵：${styleDna.tone_features}
- CTA / 收尾：${styleDna.cta_pattern}
- 格式規範：${styleDna.format_specs}
- 高互動特徵：${styleDna.high_engagement_features}
- 禁忌：${styleDna.taboos}
`;
}

export function buildMultiPlatformPrompt(
  transcript: string,
  styleDna?: StyleDimensions,
): string {
  const platformSection = ALL_PLATFORMS.map((p) => {
    const spec = PLATFORM_SPECS[p];
    return `${spec.name}：${spec.guidelines}`;
  }).join("\n");

  return `以下是一集 Podcast 的逐字稿。請根據內容為 6 個平台各生成一篇社群文案。

## 逐字稿
${transcript}
${buildStyleSection(styleDna)}
## 各平台規範
${platformSection}

## 輸出格式
請以 JSON 格式回傳，每個 key 為平台小寫名稱，value 為該平台的完整文案：
\`\`\`json
{
  "threads": "...",
  "facebook": "...",
  "instagram": "...",
  "linkedin": "...",
  "blog": "...",
  "newsletter": "..."
}
\`\`\`

注意：只回傳 JSON，不要加任何其他說明文字。`;
}

export function buildSinglePlatformPrompt(
  transcript: string,
  platform: Platform,
  styleDna?: StyleDimensions,
): string {
  const spec = PLATFORM_SPECS[platform];

  return `以下是一集 Podcast 的逐字稿。請為 ${spec.name} 平台生成一篇社群文案。

## 逐字稿
${transcript}
${buildStyleSection(styleDna)}
## ${spec.name} 平台規範
${spec.guidelines}

請直接輸出文案內容，不要加 JSON 包裝或其他說明文字。`;
}
