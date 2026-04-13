"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateAllPlatforms,
  generateSinglePlatform,
} from "@/lib/anthropic/generate-content";
import { ALL_PLATFORMS } from "@/lib/prompts/generate-content";
import { Platform } from "@/lib/types";

export async function generateContentAction(episodeId: string) {
  const supabase = createAdminClient();

  // Get transcript
  const { data: transcript, error: txError } = await supabase
    .from("transcripts")
    .select("full_text")
    .eq("episode_id", episodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (txError || !transcript) {
    return { error: "找不到逐字稿，請先完成轉錄。" };
  }

  try {
    const results = await generateAllPlatforms(transcript.full_text);

    // Delete existing content for this episode
    await supabase.from("contents").delete().eq("episode_id", episodeId);

    // Insert new content (store original_body for diff analysis)
    const inserts = ALL_PLATFORMS.map((platform) => ({
      episode_id: episodeId,
      platform,
      body: results[platform],
      original_body: results[platform],
      status: "draft",
    }));

    const { error: insertError } = await supabase
      .from("contents")
      .insert(inserts);

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "文案生成失敗";
    return { error: message };
  }
}

export async function regenerateSingleAction(
  episodeId: string,
  platform: Platform,
) {
  const supabase = createAdminClient();

  // Get transcript
  const { data: transcript, error: txError } = await supabase
    .from("transcripts")
    .select("full_text")
    .eq("episode_id", episodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (txError || !transcript) {
    return { error: "找不到逐字稿。" };
  }

  try {
    const body = await generateSinglePlatform(
      transcript.full_text,
      platform,
    );

    // Delete existing content for this episode+platform
    await supabase
      .from("contents")
      .delete()
      .eq("episode_id", episodeId)
      .eq("platform", platform);

    // Insert new (store original_body for diff analysis)
    const { error: insertError } = await supabase.from("contents").insert({
      episode_id: episodeId,
      platform,
      body,
      original_body: body,
      status: "draft",
    });

    if (insertError) throw insertError;

    return { success: true, body };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "重新生成失敗";
    return { error: message };
  }
}

export async function updateContentAction(contentId: string, body: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contents")
    .update({ body })
    .eq("id", contentId);

  if (error) {
    return { error: "儲存失敗" };
  }

  return { success: true };
}

export async function scheduleContentAction(
  contentId: string,
  scheduledAt: string,
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contents")
    .update({ status: "scheduled", scheduled_at: scheduledAt })
    .eq("id", contentId);

  if (error) return { error: "排程設定失敗" };
  return { success: true };
}

export async function publishNowAction(contentId: string) {
  const { publishContent } = await import("@/lib/meta/publish");
  return publishContent(contentId);
}

export async function cancelScheduleAction(contentId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contents")
    .update({ status: "draft", scheduled_at: null })
    .eq("id", contentId);

  if (error) return { error: "取消排程失敗" };
  return { success: true };
}

export async function analyzeEditDiffAction(contentId: string) {
  const supabase = createAdminClient();

  const { data: content, error } = await supabase
    .from("contents")
    .select("platform, body, original_body")
    .eq("id", contentId)
    .single();

  if (error || !content) return { error: "找不到此內容" };
  if (!content.original_body) return { error: "沒有原始版本可供比對" };
  if (content.body === content.original_body) return { error: "內容未修改，無差異可分析" };

  try {
    const { analyzeEditDiff } = await import("@/lib/anthropic/analyze-edit");
    const suggestions = await analyzeEditDiff(
      content.platform,
      content.original_body,
      content.body,
    );
    return { success: true, suggestions };
  } catch (err) {
    const message = err instanceof Error ? err.message : "分析失敗";
    return { error: message };
  }
}

export async function applyStyleSuggestionsAction(
  styleDnaId: string,
  updates: Record<string, string>,
) {
  const supabase = createAdminClient();

  const { data: style, error: fetchError } = await supabase
    .from("style_dnas")
    .select("dimensions")
    .eq("id", styleDnaId)
    .single();

  if (fetchError || !style) return { error: "找不到此風格" };

  const merged = { ...style.dimensions, ...updates };

  const { error: updateError } = await supabase
    .from("style_dnas")
    .update({ dimensions: merged })
    .eq("id", styleDnaId);

  if (updateError) return { error: "更新風格失敗" };
  return { success: true };
}
