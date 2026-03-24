const GRAPH_API = "https://graph.facebook.com/v21.0";

interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function publishToFacebook(
  config: FacebookConfig,
  message: string,
): Promise<PublishResult> {
  const url = `${GRAPH_API}/${config.pageId}/feed`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: config.pageAccessToken,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: data.error?.message || `Facebook API error: ${res.status}`,
    };
  }

  return { success: true, postId: data.id };
}

export async function validateFacebookToken(
  token: string,
): Promise<{ valid: boolean; pageName?: string; error?: string }> {
  const res = await fetch(
    `${GRAPH_API}/me?fields=name&access_token=${token}`,
  );
  const data = await res.json();

  if (!res.ok) {
    return { valid: false, error: data.error?.message || "Invalid token" };
  }

  return { valid: true, pageName: data.name };
}
