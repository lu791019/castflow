export function buildAnalyzeEditPrompt(
  platform: string,
  originalBody: string,
  editedBody: string,
): string {
  return `你是一位社群內容風格分析專家。以下是一篇 ${platform} 平台文案的原始版本和用戶手動修改後的版本。

請比對兩個版本的差異，分析用戶的修改偏好，並推測這些修改反映了哪些風格傾向。

## 原始版本（AI 生成）
${originalBody}

## 修改後版本（用戶手動修改）
${editedBody}

## 分析任務
請從修改差異中萃取風格偏好建議。每條建議對應一個風格維度（可以是已知維度如 tone_features、hook_pattern 等，也可以是新的自訂維度）。

回傳 JSON 陣列格式：
\`\`\`json
[
  {
    "dimension": "維度名稱（英文 key 或中文自訂名稱）",
    "original": "原始版本中該維度的表現",
    "suggested": "根據修改推測的偏好",
    "reason": "為什麼這樣判斷（簡述修改了什麼）"
  }
]
\`\`\`

注意：
- 只回傳 JSON 陣列，不要加其他說明
- 如果修改很小或無明顯風格偏好變化，回傳空陣列 []
- 每條建議用繁體中文描述`;
}
