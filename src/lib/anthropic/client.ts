import { execFile } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const CLAUDE_CLI = process.env.CLAUDE_CLI || "claude";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export interface AiConfig {
  provider: "cli" | "api" | "auto";
  api_key?: string;
  model?: string;
}

/**
 * 從 DB 讀取 AI 設定，fallback 到環境變數
 * 優先順序：DB 設定 > 環境變數 > 預設值
 *
 * provider 邏輯：
 * - "api"  → 強制走 Anthropic API
 * - "cli"  → 強制走 claude --print CLI
 * - "auto" → 有 API Key（DB 或環境變數）走 API，否則走 CLI
 */
async function resolveConfig(): Promise<{ provider: "cli" | "api"; apiKey?: string; model: string }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ai_config")
    .single();

  const db = data?.value as AiConfig | null;
  const dbModel = db?.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  if (db?.provider === "api") {
    const apiKey = db.api_key || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("已選擇 API 模式但未設定 API Key（頁面設定或環境變數 ANTHROPIC_API_KEY）");
    return { provider: "api", apiKey, model: dbModel };
  }

  if (db?.provider === "cli") {
    return { provider: "cli", model: dbModel };
  }

  // "auto" 或 DB 沒設定 → 有 API Key 走 API，否則走 CLI
  const autoApiKey = db?.api_key || process.env.ANTHROPIC_API_KEY;
  if (autoApiKey) {
    return { provider: "api", apiKey: autoApiKey, model: dbModel };
  }
  return { provider: "cli", model: dbModel };
}

/**
 * 統一入口：根據設定自動選擇 CLI 或 API
 * - DB 設定 ai_config.provider = "api" → 走 Anthropic API
 * - DB 設定 ai_config.provider = "cli" → 走 claude --print CLI
 * - 未設定 → 有 ANTHROPIC_API_KEY 環境變數走 API，否則走 CLI
 */
export async function runClaudePrint(prompt: string): Promise<string> {
  const config = await resolveConfig();
  if (config.provider === "api") {
    return runAnthropicApi(prompt, config.apiKey!, config.model);
  }
  return runClaudeCli(prompt);
}

async function runAnthropicApi(prompt: string, apiKey: string, model: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic API 回應中無文字內容");
  }
  return textBlock.text;
}

function runClaudeCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      CLAUDE_CLI,
      ["--print"],
      { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`claude --print 失敗: ${stderr || error.message}`));
          return;
        }
        resolve(stdout.trim());
      },
    );

    if (child.stdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }
  });
}
