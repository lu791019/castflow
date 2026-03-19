"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStyleAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";

interface Example {
  content: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export default function NewStylePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("threads");
  const [examples, setExamples] = useState<Example[]>([{ content: "" }]);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");

  function updateExample(index: number, field: keyof Example, value: string | number) {
    setExamples((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    );
  }

  function addExample() {
    setExamples((prev) => [...prev, { content: "" }]);
  }

  function removeExample(index: number) {
    setExamples((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleExtract() {
    const validExamples = examples.filter((ex) => ex.content.trim());
    if (validExamples.length < 3) {
      setError("至少需要 3 篇範例文案");
      return;
    }

    setExtracting(true);
    setError("");

    const result = await createStyleAction(name || `${platform} 風格`, platform, validExamples);

    if (result.error) {
      setError(result.error);
      setExtracting(false);
    } else {
      router.push(`/styles/${result.styleId}`);
    }
  }

  const platforms = [
    { value: "threads", label: "Threads" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "blog", label: "Blog" },
    { value: "newsletter", label: "Newsletter" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">建立新風格</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          貼入範例文案，AI 將提取 7 維度風格 DNA
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">風格名稱</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：我的 Threads 風格"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">平台</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            範例文案（{examples.length} 篇）
          </h2>
          <Button variant="outline" size="sm" onClick={addExample}>
            <Plus className="mr-1 h-3 w-3" />
            新增範例
          </Button>
        </div>

        {examples.map((ex, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">範例 {i + 1}</span>
              {examples.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExample(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <textarea
              value={ex.content}
              onChange={(e) => updateExample(i, "content", e.target.value)}
              className="min-h-[120px] w-full resize-y rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="貼入一篇已發布的文案..."
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">讚</label>
                <Input
                  type="number"
                  value={ex.likes ?? ""}
                  onChange={(e) => updateExample(i, "likes", Number(e.target.value))}
                  placeholder="選填"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">留言</label>
                <Input
                  type="number"
                  value={ex.comments ?? ""}
                  onChange={(e) => updateExample(i, "comments", Number(e.target.value))}
                  placeholder="選填"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">分享</label>
                <Input
                  type="number"
                  value={ex.shares ?? ""}
                  onChange={(e) => updateExample(i, "shares", Number(e.target.value))}
                  placeholder="選填"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleExtract} disabled={extracting} className="w-full">
        {extracting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            提取風格 DNA 中（約 30 秒）...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            提取風格 DNA
          </>
        )}
      </Button>
    </div>
  );
}
