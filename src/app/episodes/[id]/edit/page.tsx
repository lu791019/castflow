"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Content, Platform } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/prompts/generate-content";
import { PlatformTabs } from "@/components/content/platform-tabs";
import { ContentEditor } from "@/components/content/content-editor";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [episodeId, setEpisodeId] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [contents, setContents] = useState<Content[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform>("threads");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData(id: string) {
      const supabase = createClient();

      const [epResult, contentResult] = await Promise.all([
        supabase.from("episodes").select("title").eq("id", id).single(),
        supabase
          .from("contents")
          .select("*")
          .eq("episode_id", id)
          .order("platform"),
      ]);

      if (epResult.data) setEpisodeTitle(epResult.data.title);
      if (contentResult.data) setContents(contentResult.data as Content[]);

      setLoading(false);
    }

    params.then(({ id }) => {
      setEpisodeId(id);
      loadData(id);
    });
  }, [params]);

  const handleUpdate = useCallback(
    (contentId: string, body: string) => {
      setContents((prev) =>
        prev.map((c) => (c.id === contentId ? { ...c, body } : c)),
      );
    },
    [],
  );

  const activeContent = contents.find((c) => c.platform === activePlatform);
  const availablePlatforms = contents.map((c) => c.platform as Platform);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中...
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{episodeTitle}</h1>
        <p className="mt-4 text-muted-foreground">
          尚未生成文案。
        </p>
        <Link href={`/episodes/${episodeId}/generate`}>
          <Button className="mt-4">
            <Sparkles className="mr-2 h-4 w-4" />
            前往生成文案
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{episodeTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            內容編輯器 — {contents.length} 個平台
          </p>
        </div>
        <Link href={`/episodes/${episodeId}/generate`}>
          <Button variant="outline" size="sm">
            <Sparkles className="mr-1 h-3 w-3" />
            重新生成全部
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <PlatformTabs
          activePlatform={activePlatform}
          onSelect={setActivePlatform}
          platforms={
            availablePlatforms.length > 0 ? availablePlatforms : ALL_PLATFORMS
          }
        />

        <div className="mt-4">
          {activeContent ? (
            <ContentEditor
              key={activeContent.id}
              content={activeContent}
              episodeId={episodeId}
              onUpdate={handleUpdate}
            />
          ) : (
            <p className="text-muted-foreground">
              此平台尚無內容。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
