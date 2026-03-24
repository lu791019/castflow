import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAllPlatforms } from "@/lib/anthropic/generate-content";
import { ALL_PLATFORMS } from "@/lib/prompts/generate-content";

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { episodeId } = await request.json();
  if (!episodeId) {
    return NextResponse.json(
      { error: "episodeId is required" },
      { status: 400 },
    );
  }

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
    return NextResponse.json(
      { error: "Transcript not found for this episode" },
      { status: 404 },
    );
  }

  try {
    const results = await generateAllPlatforms(transcript.full_text);

    // Delete existing content for this episode (regenerate all)
    await supabase.from("contents").delete().eq("episode_id", episodeId);

    // Insert new content for each platform
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

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Content generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
