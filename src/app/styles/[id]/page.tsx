"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StyleDimensions } from "@/lib/types";
import { updateStyleDimensionsAction, deleteStyleAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Check, Trash2 } from "lucide-react";

const DIMENSION_LABELS: Record<keyof StyleDimensions, string> = {
  structure_pattern: "結構模式",
  hook_pattern: "開場 Hook 模式",
  tone_features: "語氣特徵",
  cta_pattern: "CTA / 收尾模式",
  format_specs: "長度 / 格式",
  high_engagement_features: "高互動特徵",
  taboos: "禁忌",
};

export default function StyleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [styleId, setStyleId] = useState("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [exampleCount, setExampleCount] = useState(0);
  const [dimensions, setDimensions] = useState<StyleDimensions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load(id: string) {
      const supabase = createClient();
      const { data } = await supabase
        .from("style_dnas")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setName(data.name);
        setPlatform(data.platform);
        setExampleCount(data.source_example_count);
        setDimensions(data.dimensions as StyleDimensions);
      }
      setLoading(false);
    }

    params.then(({ id }) => {
      setStyleId(id);
      load(id);
    });
  }, [params]);

  async function handleSave() {
    if (!dimensions) return;
    setSaving(true);
    await updateStyleDimensionsAction(styleId, dimensions);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!confirm("確定要刪除此風格 DNA？")) return;
    await deleteStyleAction(styleId);
    router.push("/styles");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中...
      </div>
    );
  }

  if (!dimensions) {
    return <p className="text-muted-foreground">找不到此風格。</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {platform} · {exampleCount} 篇範例
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : saved ? (
              <Check className="mr-1 h-3 w-3" />
            ) : (
              <Save className="mr-1 h-3 w-3" />
            )}
            {saved ? "已儲存" : "儲存"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            刪除
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {(Object.keys(DIMENSION_LABELS) as (keyof StyleDimensions)[]).map(
          (key) => (
            <div key={key} className="rounded-lg border p-4">
              <label className="block text-sm font-semibold mb-2">
                {DIMENSION_LABELS[key]}
              </label>
              <textarea
                value={dimensions[key]}
                onChange={(e) =>
                  setDimensions((prev) =>
                    prev ? { ...prev, [key]: e.target.value } : prev,
                  )
                }
                className="min-h-[80px] w-full resize-y rounded-lg border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
