"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { extractStyleDna } from "@/lib/anthropic/extract-style";
import { StyleDimensions } from "@/lib/types";

export async function createStyleAction(
  name: string,
  platform: string,
  examples: { content: string; likes?: number; comments?: number; shares?: number }[],
) {
  try {
    const dimensions = await extractStyleDna(platform, examples);
    const supabase = createAdminClient();

    // Save examples
    const { data: style, error: styleError } = await supabase
      .from("style_dnas")
      .insert({
        name,
        platform,
        dimensions,
        source_example_count: examples.length,
      })
      .select()
      .single();

    if (styleError || !style) throw styleError;

    // Save examples linked to this DNA
    const exampleInserts = examples.map((ex) => ({
      style_dna_id: style.id,
      platform,
      content: ex.content,
      engagement: { likes: ex.likes, comments: ex.comments, shares: ex.shares },
    }));

    await supabase.from("style_examples").insert(exampleInserts);

    return { success: true, styleId: style.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "風格提取失敗";
    return { error: message };
  }
}

export async function updateStyleDimensionsAction(
  styleId: string,
  dimensions: StyleDimensions,
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("style_dnas")
    .update({ dimensions })
    .eq("id", styleId);

  if (error) return { error: "儲存失敗" };
  return { success: true };
}

export async function deleteStyleAction(styleId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("style_dnas")
    .delete()
    .eq("id", styleId);

  if (error) return { error: "刪除失敗" };
  return { success: true };
}
