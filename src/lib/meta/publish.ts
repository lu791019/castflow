import { createAdminClient } from "@/lib/supabase/admin";
import { publishToFacebook } from "./facebook";
import { publishToThreads } from "./threads";
import { Platform } from "@/lib/types";

interface MetaSettings {
  facebook?: { page_id: string; page_access_token: string };
  threads?: { user_id: string; access_token: string };
}

async function getMetaSettings(): Promise<MetaSettings> {
  const supabase = createAdminClient();
  const settings: MetaSettings = {};

  const { data: fb } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "meta_facebook")
    .single();
  if (fb?.value) settings.facebook = fb.value as MetaSettings["facebook"];

  const { data: th } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "meta_threads")
    .single();
  if (th?.value) settings.threads = th.value as MetaSettings["threads"];

  return settings;
}

export async function publishContent(contentId: string) {
  const supabase = createAdminClient();

  const { data: content, error } = await supabase
    .from("contents")
    .select("*")
    .eq("id", contentId)
    .single();

  if (error || !content) {
    return { success: false, error: "Content not found" };
  }

  const platform = content.platform as Platform;
  const meta = await getMetaSettings();

  let result: { success: boolean; postId?: string; error?: string };

  if (platform === "facebook") {
    if (!meta.facebook?.page_id || !meta.facebook?.page_access_token) {
      return { success: false, error: "Facebook 尚未連結，請至 Settings 設定" };
    }
    result = await publishToFacebook(
      {
        pageId: meta.facebook.page_id,
        pageAccessToken: meta.facebook.page_access_token,
      },
      content.body,
    );
  } else if (platform === "threads") {
    if (!meta.threads?.user_id || !meta.threads?.access_token) {
      return { success: false, error: "Threads 尚未連結，請至 Settings 設定" };
    }
    result = await publishToThreads(
      {
        userId: meta.threads.user_id,
        accessToken: meta.threads.access_token,
      },
      content.body,
    );
  } else {
    return {
      success: false,
      error: `平台 ${platform} 不支援直接發布，請使用複製功能手動發布`,
    };
  }

  // Log the publish attempt
  await supabase.from("publish_logs").insert({
    content_id: contentId,
    platform,
    platform_post_id: result.postId || null,
    response: result as Record<string, unknown>,
    status: result.success ? "success" : "failed",
    error_message: result.error || null,
  });

  // Update content status
  await supabase
    .from("contents")
    .update({
      status: result.success ? "published" : "failed",
      published_at: result.success ? new Date().toISOString() : null,
    })
    .eq("id", contentId);

  return result;
}

export async function publishScheduledContents() {
  const supabase = createAdminClient();

  const { data: dueContents } = await supabase
    .from("contents")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());

  if (!dueContents || dueContents.length === 0) {
    return { published: 0, failed: 0 };
  }

  let published = 0;
  let failed = 0;

  for (const content of dueContents) {
    const result = await publishContent(content.id);
    if (result.success) published++;
    else failed++;
  }

  return { published, failed };
}
