import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function StylesPage() {
  const supabase = createAdminClient();
  const { data: styles } = await supabase
    .from("style_dnas")
    .select("*")
    .order("extracted_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Styles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理你的風格 DNA
          </p>
        </div>
        <Link href="/styles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            建立新風格
          </Button>
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {styles && styles.length > 0 ? (
          styles.map((style) => (
            <Link
              key={style.id}
              href={`/styles/${style.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{style.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {style.platform} · {style.source_example_count} 篇範例 ·{" "}
                    {new Date(style.extracted_at).toLocaleDateString("zh-TW")}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground">
            尚無風格 DNA。點擊「建立新風格」開始提取。
          </p>
        )}
      </div>
    </div>
  );
}
