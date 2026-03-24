import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { transcribeAudio } from "@/lib/openai/whisper";

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { episodeId } = await request.json();
  if (!episodeId) {
    return NextResponse.json({ error: "episodeId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get episode
  const { data: episode, error: epError } = await supabase
    .from("episodes")
    .select("*")
    .eq("id", episodeId)
    .single();

  if (epError || !episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  // Update status to transcribing
  await supabase
    .from("episodes")
    .update({ status: "transcribing" })
    .eq("id", episodeId);

  try {
    const result = await transcribeAudio(episode.audio_url);

    // Save transcript
    const { error: insertError } = await supabase.from("transcripts").insert({
      episode_id: episodeId,
      full_text: result.fullText,
      segments: result.segments,
      language: result.language,
    });

    if (insertError) throw insertError;

    // Update episode status
    await supabase
      .from("episodes")
      .update({ status: "transcribed" })
      .eq("id", episodeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    await supabase
      .from("episodes")
      .update({ status: "error" })
      .eq("id", episodeId);

    const message = error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
