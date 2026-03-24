export function buildExtractStylePrompt(
  platform: string,
  examples: { content: string; likes?: number; comments?: number; shares?: number }[],
): string {
  const examplesText = examples
    .map((ex, i) => {
      let text = `--- 範例 ${i + 1} ---\n${ex.content}`;
      if (ex.likes !== undefined || ex.comments !== undefined) {
        const engagement = [
          ex.likes !== undefined ? `讚 ${ex.likes}` : "",
          ex.comments !== undefined ? `留言 ${ex.comments}` : "",
          ex.shares !== undefined ? `分享 ${ex.shares}` : "",
        ]
          .filter(Boolean)
          .join("、");
        text += `\n[互動數據：${engagement}]`;
      }
      return text;
    })
    .join("\n\n");

  return `你是一位社群內容分析專家。請分析以下 ${platform} 平台的 ${examples.length} 篇範例文案，提取風格 DNA。

## 範例文案
${examplesText}

## 分析任務
請從上述範例中提取以下 7 個維度的風格模式。每個維度都要具體描述觀察到的模式，而非泛泛而談。

回傳 JSON 格式：
\`\`\`json
{
  "structure_pattern": "結構模式：描述文案的段落結構、排版邏輯（例如：Hook → 3 個條列 → 金句收尾）",
  "hook_pattern": "開場 Hook 模式：描述開場的常見手法（例如：反差型提問、數據開場、共感宣言）",
  "tone_features": "語氣特徵：口語比例、用字習慣、人稱用法、語氣詞使用",
  "cta_pattern": "CTA / 收尾模式：結尾的行動呼籲或收束方式",
  "format_specs": "長度 / 格式：字數範圍、emoji 使用頻率、分段方式、hashtag 習慣",
  "high_engagement_features": "高互動特徵：從互動數據回推，高互動文案的共同特徵",
  "taboos": "禁忌：明確避免的模式或用語"
}
\`\`\`

注意：只回傳 JSON，不要加其他說明。每個維度用 2-4 句繁體中文描述。`;
}
