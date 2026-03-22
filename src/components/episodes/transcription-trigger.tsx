"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startTranscriptionAction } from "@/app/episodes/[id]/actions";
import { Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TranscriptionTrigger({
  episodeId,
  status,
}: {
  episodeId: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const triggered = useRef(false);

  useEffect(() => {
    if (status !== "uploaded" || triggered.current) return;
    triggered.current = true;

    startTranscriptionAction(episodeId).then((result) => {
      if (result.error) {
        setError(result.error);
      }
      router.refresh();
    });
  }, [status, episodeId, router]);

  const handleRetry = () => {
    setError("");
    triggered.current = false;
    router.refresh();
  };

  if (error) {
    return (
      <div className="flex items-center gap-3">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">轉錄失敗：{error}</span>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RotateCcw className="mr-1 h-3 w-3" />
          重試
        </Button>
      </div>
    );
  }

  if (status === "uploaded" || status === "transcribing") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>轉錄中，請稍候...（Groq Whisper 通常幾秒內完成）</span>
      </div>
    );
  }

  return null;
}
