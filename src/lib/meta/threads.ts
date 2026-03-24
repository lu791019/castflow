const THREADS_API = "https://graph.threads.net/v1.0";

interface ThreadsConfig {
  userId: string;
  accessToken: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function publishToThreads(
  config: ThreadsConfig,
  text: string,
): Promise<PublishResult> {
  // Step 1: Create media container
  const containerRes = await fetch(
    `${THREADS_API}/${config.userId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "TEXT",
        text,
        access_token: config.accessToken,
      }),
    },
  );

  const containerData = await containerRes.json();

  if (!containerRes.ok) {
    return {
      success: false,
      error:
        containerData.error?.message ||
        `Threads container error: ${containerRes.status}`,
    };
  }

  // Step 2: Publish the container
  const publishRes = await fetch(
    `${THREADS_API}/${config.userId}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: config.accessToken,
      }),
    },
  );

  const publishData = await publishRes.json();

  if (!publishRes.ok) {
    return {
      success: false,
      error:
        publishData.error?.message ||
        `Threads publish error: ${publishRes.status}`,
    };
  }

  return { success: true, postId: publishData.id };
}

export async function validateThreadsToken(
  userId: string,
  token: string,
): Promise<{ valid: boolean; username?: string; error?: string }> {
  const res = await fetch(
    `${THREADS_API}/${userId}?fields=username&access_token=${token}`,
  );
  const data = await res.json();

  if (!res.ok) {
    return { valid: false, error: data.error?.message || "Invalid token" };
  }

  return { valid: true, username: data.username };
}
