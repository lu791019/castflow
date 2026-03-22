"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { transcribeAudio } from "@/lib/openai/whisper";

export async function startTranscriptionAction(episodeId: string) {
  const supabase = createAdminClient();

  const { data: episode, error: epError } = await supabase
    .from("episodes")
    .select("*")
    .eq("id", episodeId)
    .single();

  if (epError || !episode) {
    return { error: "找不到集數" };
  }

  if (episode.status !== "uploaded") {
    return { error: `此集數狀態為「${episode.status}」，無法轉錄` };
  }

  await supabase
    .from("episodes")
    .update({ status: "transcribing" })
    .eq("id", episodeId);

  try {
    const result = await transcribeAudio(episode.audio_url);

    const { error: insertError } = await supabase.from("transcripts").insert({
      episode_id: episodeId,
      full_text: result.fullText,
      segments: result.segments,
      language: result.language,
    });

    if (insertError) throw insertError;

    await supabase
      .from("episodes")
      .update({ status: "transcribed" })
      .eq("id", episodeId);

    return { success: true };
  } catch (error) {
    await supabase
      .from("episodes")
      .update({ status: "error" })
      .eq("id", episodeId);

    const message = error instanceof Error ? error.message : "轉錄失敗";
    return { error: message };
  }
}
