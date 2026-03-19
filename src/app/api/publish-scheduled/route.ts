import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-guard";
import { publishScheduledContents } from "@/lib/meta/publish";

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const result = await publishScheduledContents();

  return NextResponse.json(result);
}
