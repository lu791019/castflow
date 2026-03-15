"use client";

import type { TranscriptSegment } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TranscriptViewer({ segments }: { segments: TranscriptSegment[] }) {
  if (!segments.length) {
    return <p className="text-muted-foreground">尚無轉錄內容。</p>;
  }

  return (
    <div className="space-y-2">
      {segments.map((seg, i) => (
        <div key={i} className="flex gap-3 rounded p-2 hover:bg-muted/50">
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums pt-0.5">
            {formatTime(seg.start)}
          </span>
          <p className="text-sm leading-relaxed">{seg.text}</p>
        </div>
      ))}
    </div>
  );
}
