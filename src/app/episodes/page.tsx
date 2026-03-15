import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function EpisodesPage() {
  const supabase = createAdminClient();
  const { data: episodes } = await supabase
    .from("episodes")
    .select("*")
    .order("created_at", { ascending: false });

  const statusLabels: Record<string, string> = {
    uploaded: "已上傳",
    transcribing: "轉錄中",
    transcribed: "已轉錄",
    error: "錯誤",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Episodes</h1>
        <Link href="/episodes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            上傳新集數
          </Button>
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {episodes && episodes.length > 0 ? (
          episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/episodes/${ep.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{ep.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(ep.created_at).toLocaleDateString("zh-TW")}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {statusLabels[ep.status] ?? ep.status}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground">尚無集數，點擊「上傳新集數」開始。</p>
        )}
      </div>
    </div>
  );
}
