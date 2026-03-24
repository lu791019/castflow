"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validateFacebookToken } from "@/lib/meta/facebook";
import { validateThreadsToken } from "@/lib/meta/threads";

export async function getMetaConnectionStatus() {
  const supabase = createAdminClient();

  const [{ data: fb }, { data: th }] = await Promise.all([
    supabase.from("settings").select("value, updated_at").eq("key", "meta_facebook").single(),
    supabase.from("settings").select("value, updated_at").eq("key", "meta_threads").single(),
  ]);

  return {
    facebook: fb
      ? { connected: true, updatedAt: fb.updated_at, ...fb.value }
      : { connected: false },
    threads: th
      ? { connected: true, updatedAt: th.updated_at, ...th.value }
      : { connected: false },
  };
}

export async function saveFacebookSettings(pageId: string, pageAccessToken: string) {
  // Validate token first
  const validation = await validateFacebookToken(pageAccessToken);
  if (!validation.valid) {
    return { error: `Token 驗證失敗：${validation.error}` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("settings").upsert({
    key: "meta_facebook",
    value: {
      page_id: pageId,
      page_access_token: pageAccessToken,
      page_name: validation.pageName,
    },
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "儲存失敗" };
  return { success: true, pageName: validation.pageName };
}

export async function saveThreadsSettings(userId: string, accessToken: string) {
  const validation = await validateThreadsToken(userId, accessToken);
  if (!validation.valid) {
    return { error: `Token 驗證失敗：${validation.error}` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("settings").upsert({
    key: "meta_threads",
    value: {
      user_id: userId,
      access_token: accessToken,
      username: validation.username,
    },
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "儲存失敗" };
  return { success: true, username: validation.username };
}

export async function disconnectPlatform(platform: "meta_facebook" | "meta_threads") {
  const supabase = createAdminClient();
  await supabase.from("settings").delete().eq("key", platform);
  return { success: true };
}

// --- AI 設定 ---

export async function getAiConfig() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ai_config")
    .single();

  const config = data?.value as { provider?: string; api_key?: string; model?: string } | null;
  return {
    provider: config?.provider || "auto",
    api_key: config?.api_key || "",
    model: config?.model || "claude-sonnet-4-20250514",
    has_env_key: !!process.env.ANTHROPIC_API_KEY,
  };
}

export async function saveAiConfig(provider: string, apiKey: string, model: string) {
  if (provider === "api" && !apiKey && !process.env.ANTHROPIC_API_KEY) {
    return { error: "API 模式需要填入 API Key（或設定環境變數 ANTHROPIC_API_KEY）" };
  }

  const supabase = createAdminClient();
  const value: Record<string, string> = { provider, model };
  if (apiKey) value.api_key = apiKey;

  const { error } = await supabase.from("settings").upsert({
    key: "ai_config",
    value,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "儲存失敗" };
  return { success: true };
}
