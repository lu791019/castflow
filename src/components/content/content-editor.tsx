"use client";

import { useState, useCallback } from "react";
import { Platform, Content } from "@/lib/types";
import { PLATFORM_SPECS } from "@/lib/prompts/generate-content";
import {
  regenerateSingleAction,
  updateContentAction,
} from "@/app/episodes/[id]/generate/actions";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, RefreshCw, Save, Check } from "lucide-react";

interface ContentEditorProps {
  content: Content;
  episodeId: string;
  onUpdate: (contentId: string, body: string) => void;
}

export function ContentEditor({
  content,
  episodeId,
  onUpdate,
}: ContentEditorProps) {
  const spec = PLATFORM_SPECS[content.platform];
  const [body, setBody] = useState(content.body);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const charCount = body.length;
  const isOverLimit = charCount > spec.maxChars;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    const result = await updateContentAction(content.id, body);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      onUpdate(content.id, body);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [body, content.id, onUpdate]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    setError("");
    const result = await regenerateSingleAction(
      episodeId,
      content.platform as Platform,
    );
    setRegenerating(false);

    if (result.error) {
      setError(result.error);
    } else if (result.body) {
      setBody(result.body);
      onUpdate(content.id, result.body);
    }
  }, [episodeId, content.platform, content.id, onUpdate]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [body]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isOverLimit ? "font-medium text-destructive" : "text-muted-foreground"}`}
          >
            {charCount} / {spec.maxChars} 字
          </span>
          {isOverLimit && (
            <span className="text-xs text-destructive">
              超出 {charCount - spec.maxChars} 字
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!body}
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                已複製
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                複製
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            重新生成
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || body === content.body}
          >
            {saving ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : saved ? (
              <Check className="mr-1 h-3 w-3" />
            ) : (
              <Save className="mr-1 h-3 w-3" />
            )}
            {saved ? "已儲存" : "儲存"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[400px] w-full resize-y rounded-lg border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={`在此編輯 ${spec.name} 文案...`}
      />
    </div>
  );
}
