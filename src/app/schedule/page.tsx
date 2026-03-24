import { createAdminClient } from "@/lib/supabase/admin";
import { PLATFORM_SPECS } from "@/lib/prompts/generate-content";
import { Platform } from "@/lib/types";
import Link from "next/link";

export default async function SchedulePage() {
  const supabase = createAdminClient();

  const { data: contents } = await supabase
    .from("contents")
    .select("*, episodes(title)")
    .in("status", ["scheduled", "published", "failed"])
    .order("scheduled_at", { ascending: true });

  // Group by date
  const grouped: Record<string, typeof contents> = {};
  for (const item of contents ?? []) {
    const date = item.scheduled_at
      ? new Date(item.scheduled_at).toLocaleDateString("zh-TW")
      : item.published_at
        ? new Date(item.published_at).toLocaleDateString("zh-TW")
        : "未排程";

    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    scheduled: { label: "已排程", color: "text-blue-600" },
    published: { label: "已發布", color: "text-green-600" },
    failed: { label: "失敗", color: "text-red-600" },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Schedule</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        排程與發布紀錄
      </p>

      <div className="mt-6 space-y-6">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {date}
              </h2>
              <div className="space-y-2">
                {items!.map((item) => {
                  const episodeTitle =
                    (item.episodes as { title: string } | null)?.title ?? "未知集數";
                  const platform = item.platform as Platform;
                  const spec = PLATFORM_SPECS[platform];
                  const st = statusLabels[item.status] ?? {
                    label: item.status,
                    color: "text-muted-foreground",
                  };
                  const time = item.scheduled_at
                    ? new Date(item.scheduled_at).toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <Link
                      key={item.id}
                      href={`/episodes/${item.episode_id}/edit`}
                      className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-12 text-sm text-muted-foreground">
                        {time}
                      </span>
                      <span className="w-24 text-sm font-medium">
                        {spec?.name ?? platform}
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {episodeTitle}
                      </span>
                      <span className={`text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            尚無排程或發布紀錄。
          </p>
        )}
      </div>
    </div>
  );
}
