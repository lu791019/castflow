import { createAdminClient } from "@/lib/supabase/admin";
import { PLATFORM_SPECS } from "@/lib/prompts/generate-content";
import { Platform } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const [episodesRes, scheduledRes, publishedRes, recentContentsRes] =
    await Promise.all([
      supabase
        .from("episodes")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled"),
      supabase
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("contents")
        .select("id, episode_id, platform, status, scheduled_at, episodes(title)")
        .in("status", ["scheduled", "published"])
        .order("scheduled_at", { ascending: true })
        .limit(5),
    ]);

  const episodes = episodesRes.data ?? [];
  const scheduledCount = scheduledRes.count ?? 0;
  const publishedCount = publishedRes.count ?? 0;
  const recentContents = recentContentsRes.data ?? [];

  const statusLabels: Record<string, string> = {
    uploaded: "已上傳",
    transcribing: "轉錄中",
    transcribed: "已轉錄",
    error: "錯誤",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CastFlow — 從 Podcast 音訊到社群上架的 AI 內容管線
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">總集數</h3>
          <p className="mt-1 text-3xl font-bold">{episodes.length}</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">待發布</h3>
          <p className="mt-1 text-3xl font-bold">{scheduledCount}</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">已發布</h3>
          <p className="mt-1 text-3xl font-bold">{publishedCount}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Episodes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">最近集數</h2>
            <Link href="/episodes/new">
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-3 w-3" />
                上傳
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {episodes.length > 0 ? (
              episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/episodes/${ep.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ep.created_at).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {statusLabels[ep.status] ?? ep.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                尚無集數，點擊上傳開始。
              </p>
            )}
          </div>
        </section>

        {/* Upcoming Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">排程 / 近期發布</h2>
            <Link href="/schedule">
              <Button variant="outline" size="sm">查看全部</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentContents.length > 0 ? (
              recentContents.map((item) => {
                const platform = item.platform as Platform;
                const spec = PLATFORM_SPECS[platform];
                const ep = item.episodes as unknown as { title: string } | null;
                const episodeTitle = ep?.title ?? "";
                return (
                  <Link
                    key={item.id}
                    href={`/episodes/${item.episode_id}/edit`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="w-20 text-xs font-medium">
                      {spec?.name ?? platform}
                    </span>
                    <span className="flex-1 truncate text-sm">
                      {episodeTitle}
                    </span>
                    <span
                      className={`text-xs ${item.status === "published" ? "text-green-600" : "text-blue-600"}`}
                    >
                      {item.status === "published" ? "已發布" : "已排程"}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                尚無排程或發布紀錄。
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
