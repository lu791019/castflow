"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateContentAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [episodeId, setEpisodeId] = useState<string>("");
  const [episode, setEpisode] = useState<{
    title: string;
    status: string;
  } | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [hasContent, setHasContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData(id: string) {
      const supabase = createClient();

      const [epResult, txResult, contentResult] = await Promise.all([
        supabase.from("episodes").select("title, status").eq("id", id).single(),
        supabase
          .from("transcripts")
          .select("full_text")
          .eq("episode_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("contents")
          .select("id")
          .eq("episode_id", id)
          .limit(1),
      ]);

      if (epResult.data) setEpisode(epResult.data);
      if (txResult.data)
        setTranscriptPreview(txResult.data.full_text.slice(0, 500));
      if (contentResult.data && contentResult.data.length > 0)
        setHasContent(true);

      setLoading(false);
    }

    params.then(({ id }) => {
      setEpisodeId(id);
      loadData(id);
    });
  }, [params]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    const result = await generateContentAction(episodeId);

    if (result.error) {
      setError(result.error);
      setGenerating(false);
    } else {
      router.push(`/episodes/${episodeId}/edit`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中...
      </div>
    );
  }

  if (!episode) {
    return <p className="text-muted-foreground">找不到此集數。</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{episode.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">AI 文案生成</p>

      {transcriptPreview ? (
        <div className="mt-6 rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            逐字稿預覽
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {transcriptPreview}...
          </p>
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">
          尚無逐字稿，請先完成轉錄。
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      <div className="mt-6 flex gap-3">
        {hasContent && !generating && (
          <Link href={`/episodes/${episodeId}/edit`}>
            <Button variant="outline">
              查看已生成文案
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || !transcriptPreview}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中（約 30 秒）...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {hasContent ? "重新生成全部文案" : "生成 6 平台文案"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
