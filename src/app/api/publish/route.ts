import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-guard";
import { publishContent } from "@/lib/meta/publish";

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { contentId } = await request.json();
  if (!contentId) {
    return NextResponse.json(
      { error: "contentId is required" },
      { status: 400 },
    );
  }

  const result = await publishContent(contentId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, postId: result.postId });
}
