import Groq from "groq-sdk";
import type { TranscriptSegment } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
}

export async function transcribeAudio(
  audioUrl: string,
): Promise<TranscriptionResult> {
  const response = await fetch(audioUrl);
  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(
      `Audio file too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB). Max ${MAX_FILE_SIZE / 1024 / 1024}MB. Please compress before uploading.`,
    );
  }

  const file = new File([buffer], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await groq.audio.transcriptions.create({
    model: "whisper-large-v3-turbo",
    file,
    language: "zh",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = transcription as any;
  const rawSegments = (result.segments ?? []) as Array<{
    start: number;
    end: number;
    text: string;
  }>;

  const segments: TranscriptSegment[] = rawSegments.map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  return {
    fullText: transcription.text,
    segments,
    language: (result.language as string) ?? "zh",
  };
}
