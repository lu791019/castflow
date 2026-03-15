import OpenAI from "openai";
import type { TranscriptSegment } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
}

export async function transcribeAudio(
  audioUrl: string
): Promise<TranscriptionResult> {
  const response = await fetch(audioUrl);
  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(
      `Audio file too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB). Max ${MAX_FILE_SIZE / 1024 / 1024}MB. Please compress before uploading.`
    );
  }

  const file = new File([buffer], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "zh",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments: TranscriptSegment[] = (
    transcription.segments ?? []
  ).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  return {
    fullText: transcription.text,
    segments,
    language: transcription.language ?? "zh",
  };
}
