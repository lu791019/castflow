"use client";

import { useState, useCallback } from "react";
import { Platform, Content } from "@/lib/types";
import { PLATFORM_SPECS } from "@/lib/prompts/generate-content";
import {
  regenerateSingleAction,
  updateContentAction,
  scheduleContentAction,
  publishNowAction,
  cancelScheduleAction,
} from "@/app/episodes/[id]/generate/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Copy, RefreshCw, Save, Check, Send, Clock, X,
} from "lucide-react";

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
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [status, setStatus] = useState(content.status);
  const [error, setError] = useState("");

  const canPublish = content.platform === "threads" || content.platform === "facebook";

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

      {/* Publish / Schedule bar for Threads & Facebook */}
      {canPublish && status === "draft" && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <Button
            size="sm"
            onClick={async () => {
              setPublishing(true);
              setError("");
              const result = await publishNowAction(content.id);
              setPublishing(false);
              if (result.success) setStatus("published");
              else setError(result.error || "發布失敗");
            }}
            disabled={publishing}
          >
            {publishing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Send className="mr-1 h-3 w-3" />
            )}
            立即發布
          </Button>

          {showSchedule ? (
            <>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="h-8 w-auto text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={scheduling || !scheduleDate}
                onClick={async () => {
                  setScheduling(true);
                  setError("");
                  const result = await scheduleContentAction(
                    content.id,
                    new Date(scheduleDate).toISOString(),
                  );
                  setScheduling(false);
                  if (result.success) setStatus("scheduled");
                  else setError(result.error || "排程失敗");
                }}
              >
                {scheduling ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3 w-3" />
                )}
                確認排程
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSchedule(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSchedule(true)}
            >
              <Clock className="mr-1 h-3 w-3" />
              排程發布
            </Button>
          )}
        </div>
      )}

      {status === "scheduled" && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
          <Clock className="h-4 w-4 text-blue-600" />
          <span>已排程：{content.scheduled_at ? new Date(content.scheduled_at).toLocaleString("zh-TW") : ""}</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={async () => {
              const result = await cancelScheduleAction(content.id);
              if (result.success) setStatus("draft");
            }}
          >
            取消排程
          </Button>
        </div>
      )}

      {status === "published" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950">
          <Check className="mr-1 inline h-4 w-4 text-green-600" />
          已發布{content.published_at ? `：${new Date(content.published_at).toLocaleString("zh-TW")}` : ""}
        </div>
      )}

      {status === "failed" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950">
          <X className="h-4 w-4 text-red-600" />
          <span>發布失敗</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={async () => {
              setPublishing(true);
              const result = await publishNowAction(content.id);
              setPublishing(false);
              if (result.success) setStatus("published");
              else setError(result.error || "重試失敗");
            }}
          >
            重試
          </Button>
        </div>
      )}

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
