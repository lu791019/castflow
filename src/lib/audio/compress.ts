"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  await ffmpeg.load();
  return ffmpeg;
}

export async function compressAudio(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  // Skip compression if already under 25MB
  if (file.size <= 25 * 1024 * 1024) {
    return file;
  }

  const ff = await getFFmpeg();

  ff.on("progress", ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp3";

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    "-i", inputName,
    "-ac", "1",           // mono
    "-ab", "64k",         // 64kbps
    "-ar", "16000",       // 16kHz (Whisper optimal)
    "-y", outputName,
  ]);

  const data = await ff.readFile(outputName);
  const uint8 = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
  const blob = new Blob([new Uint8Array(uint8)], { type: "audio/mpeg" });

  // Clean up
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  return new File([blob], file.name.replace(/\.[^.]+$/, ".mp3"), {
    type: "audio/mpeg",
  });
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && ["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(ext)) {
    return "." + ext;
  }
  return ".mp3";
}
