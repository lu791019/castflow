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

    // Insert new content
    const inserts = ALL_PLATFORMS.map((platform) => ({
      episode_id: episodeId,
      platform,
      body: results[platform],
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

    // Insert new
    const { error: insertError } = await supabase.from("contents").insert({
      episode_id: episodeId,
      platform,
      body,
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
