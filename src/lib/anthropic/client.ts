import { execFile } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";

const CLAUDE_CLI = process.env.CLAUDE_CLI || "claude";

type Provider = "cli" | "anthropic" | "openai" | "gemini" | "auto";

export interface AiConfig {
  provider: Provider;
  api_key?: string;
  model?: string;
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.5-flash",
};

interface ResolvedConfig {
  provider: "cli" | "anthropic" | "openai" | "gemini";
  apiKey?: string;
  model: string;
}

/**
 * 從 DB 讀取 AI 設定，fallback 到環境變數
 *
 * provider 邏輯：
 * - "anthropic" → Anthropic API
 * - "openai"    → OpenAI API
 * - "gemini"    → Google Gemini API
 * - "cli"       → claude --print CLI
 * - "auto"      → 依序檢查有無 API Key，都沒有則走 CLI
 */
async function resolveConfig(): Promise<ResolvedConfig> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ai_config")
    .single();

  const db = data?.value as AiConfig | null;
  const provider = db?.provider || "auto";
  const dbApiKey = db?.api_key;
  const dbModel = db?.model;

  if (provider === "cli") {
    return { provider: "cli", model: "cli" };
  }

  if (provider === "anthropic") {
    const apiKey = dbApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("已選擇 Anthropic 但未設定 API Key");
    return { provider: "anthropic", apiKey, model: dbModel || process.env.ANTHROPIC_MODEL || DEFAULT_MODELS.anthropic };
  }

  if (provider === "openai") {
    const apiKey = dbApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("已選擇 OpenAI 但未設定 API Key");
    return { provider: "openai", apiKey, model: dbModel || process.env.OPENAI_MODEL || DEFAULT_MODELS.openai };
  }

  if (provider === "gemini") {
    const apiKey = dbApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("已選擇 Gemini 但未設定 API Key");
    return { provider: "gemini", apiKey, model: dbModel || process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini };
  }

  // auto: 依序檢查環境變數
  if (dbApiKey || process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic", apiKey: dbApiKey || process.env.ANTHROPIC_API_KEY, model: dbModel || DEFAULT_MODELS.anthropic };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY, model: dbModel || DEFAULT_MODELS.openai };
  }
  if (process.env.GEMINI_API_KEY) {
    return { provider: "gemini", apiKey: process.env.GEMINI_API_KEY, model: dbModel || DEFAULT_MODELS.gemini };
  }
  return { provider: "cli", model: "cli" };
}

/**
 * 統一入口：根據設定自動選擇 AI provider
 */
export async function runClaudePrint(prompt: string): Promise<string> {
  const config = await resolveConfig();

  switch (config.provider) {
    case "anthropic":
      return runAnthropicApi(prompt, config.apiKey!, config.model);
    case "openai":
      return runOpenAiApi(prompt, config.apiKey!, config.model);
    case "gemini":
      return runGeminiApi(prompt, config.apiKey!, config.model);
    case "cli":
      return runClaudeCli(prompt);
  }
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

async function runOpenAiApi(prompt: string, apiKey: string, model: string): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 8192,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI API 回應中無文字內容");
  return text;
}

async function runGeminiApi(prompt: string, apiKey: string, model: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model });
  const result = await gemini.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini API 回應中無文字內容");
  return text;
}

function runClaudeCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      CLAUDE_CLI,
      ["--print"],
      { maxBuffer: 1024 * 1024 * 10 },
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
