"use client";

import { useState, useEffect } from "react";
import {
  getMetaConnectionStatus,
  saveFacebookSettings,
  saveThreadsSettings,
  disconnectPlatform,
  getAiConfig,
  saveAiConfig,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, ExternalLink } from "lucide-react";

interface ConnectionState {
  facebook: { connected: boolean; page_name?: string; updatedAt?: string };
  threads: { connected: boolean; username?: string; updatedAt?: string };
}

export default function SettingsPage() {
  const [conn, setConn] = useState<ConnectionState | null>(null);
  const [loading, setLoading] = useState(true);

  // Facebook form
  const [fbPageId, setFbPageId] = useState("");
  const [fbToken, setFbToken] = useState("");
  const [fbSaving, setFbSaving] = useState(false);
  const [fbMsg, setFbMsg] = useState("");

  // Threads form
  const [thUserId, setThUserId] = useState("");
  const [thToken, setThToken] = useState("");
  const [thSaving, setThSaving] = useState(false);
  const [thMsg, setThMsg] = useState("");

  // AI config
  const [aiProvider, setAiProvider] = useState("auto");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiEnvKeys, setAiEnvKeys] = useState({ anthropic: false, openai: false, gemini: false });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  useEffect(() => {
    Promise.all([getMetaConnectionStatus(), getAiConfig()]).then(
      ([status, ai]) => {
        setConn(status as ConnectionState);
        setAiProvider(ai.provider);
        setAiApiKey(ai.api_key);
        setAiModel(ai.model);
        setAiEnvKeys(ai.env_keys);
        setLoading(false);
      },
    );
  }, []);

  async function handleSaveFb() {
    setFbSaving(true);
    setFbMsg("");
    const result = await saveFacebookSettings(fbPageId, fbToken);
    setFbSaving(false);
    if (result.error) {
      setFbMsg(result.error);
    } else {
      setFbMsg(`已連結：${result.pageName}`);
      setFbPageId("");
      setFbToken("");
      getMetaConnectionStatus().then((s) => setConn(s as ConnectionState));
    }
  }

  async function handleSaveTh() {
    setThSaving(true);
    setThMsg("");
    const result = await saveThreadsSettings(thUserId, thToken);
    setThSaving(false);
    if (result.error) {
      setThMsg(result.error);
    } else {
      setThMsg(`已連結：@${result.username}`);
      setThUserId("");
      setThToken("");
      getMetaConnectionStatus().then((s) => setConn(s as ConnectionState));
    }
  }

  async function handleDisconnect(platform: "meta_facebook" | "meta_threads") {
    await disconnectPlatform(platform);
    getMetaConnectionStatus().then((s) => setConn(s as ConnectionState));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入中...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta 帳號連結與 Token 管理
        </p>
      </div>

      {/* AI 設定 */}
      <section className="rounded-lg border p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">AI 文案生成</h2>
          <p className="text-sm text-muted-foreground mt-1">
            選擇文案生成的 AI 引擎
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Provider</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "auto", label: "自動偵測" },
                { value: "cli", label: "Claude CLI" },
                { value: "anthropic", label: "Anthropic" },
                { value: "openai", label: "OpenAI" },
                { value: "gemini", label: "Gemini" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setAiProvider(opt.value); setAiModel(""); }}
                  className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                    aiProvider === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {aiProvider === "auto" && "依序檢查 Anthropic → OpenAI → Gemini API Key，都沒有則走 CLI"}
              {aiProvider === "cli" && "使用本地 claude --print，走 Pro/Max 額度，零 API 費用"}
              {aiProvider === "anthropic" && "使用 Anthropic Claude API"}
              {aiProvider === "openai" && "使用 OpenAI GPT API"}
              {aiProvider === "gemini" && "使用 Google Gemini API"}
            </p>
          </div>

          {aiProvider !== "cli" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  API Key
                  {aiProvider !== "auto" && aiEnvKeys[aiProvider as keyof typeof aiEnvKeys] && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      環境變數已設定
                    </span>
                  )}
                  {aiProvider === "auto" && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {[
                        aiEnvKeys.anthropic && "Anthropic",
                        aiEnvKeys.openai && "OpenAI",
                        aiEnvKeys.gemini && "Gemini",
                      ].filter(Boolean).join("、") || "無"} 環境變數已設定
                    </span>
                  )}
                </label>
                <Input
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={
                    aiProvider === "anthropic" ? "sk-ant-..." :
                    aiProvider === "openai" ? "sk-..." :
                    aiProvider === "gemini" ? "AIza..." :
                    "填入對應 provider 的 API Key（自動模式可留空）"
                  }
                  type="password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                {aiProvider === "auto" ? (
                  <Input
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="留空使用各 provider 預設模型"
                  />
                ) : (
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {aiProvider === "anthropic" && (
                      <>
                        <option value="">預設 (Sonnet 4)</option>
                        <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                        <option value="claude-opus-4-20250514">Claude Opus 4</option>
                        <option value="claude-haiku-4-20250506">Claude Haiku 4</option>
                      </>
                    )}
                    {aiProvider === "openai" && (
                      <>
                        <option value="">預設 (GPT-4o)</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4.1">GPT-4.1</option>
                        <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                        <option value="o3-mini">o3-mini</option>
                      </>
                    )}
                    {aiProvider === "gemini" && (
                      <>
                        <option value="">預設 (Gemini 2.5 Flash)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      </>
                    )}
                  </select>
                )}
              </div>
            </>
          )}

          {aiMsg && (
            <p className={`text-sm ${aiMsg.includes("失敗") || aiMsg.includes("需要") ? "text-destructive" : "text-green-600"}`}>
              {aiMsg}
            </p>
          )}

          <Button
            size="sm"
            disabled={aiSaving}
            onClick={async () => {
              setAiSaving(true);
              setAiMsg("");
              const result = await saveAiConfig(aiProvider, aiApiKey, aiModel);
              setAiSaving(false);
              if (result.error) {
                setAiMsg(result.error);
              } else {
                setAiMsg("已儲存");
              }
            }}
          >
            {aiSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            儲存 AI 設定
          </Button>
        </div>
      </section>

      {/* Facebook */}
      <section className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Facebook Page</h2>
          {conn?.facebook.connected ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              已連結：{conn.facebook.page_name}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <X className="h-4 w-4" />
              未連結
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Page ID</label>
            <Input
              value={fbPageId}
              onChange={(e) => setFbPageId(e.target.value)}
              placeholder="例如：123456789012345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Page Access Token
            </label>
            <Input
              value={fbToken}
              onChange={(e) => setFbToken(e.target.value)}
              placeholder="EAA..."
              type="password"
            />
          </div>
          {fbMsg && (
            <p className={`text-sm ${fbMsg.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
              {fbMsg}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveFb}
              disabled={fbSaving || !fbPageId || !fbToken}
              size="sm"
            >
              {fbSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              驗證並儲存
            </Button>
            {conn?.facebook.connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect("meta_facebook")}
              >
                解除連結
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Threads */}
      <section className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Threads</h2>
          {conn?.threads.connected ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              已連結：@{conn.threads.username}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <X className="h-4 w-4" />
              未連結
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <Input
              value={thUserId}
              onChange={(e) => setThUserId(e.target.value)}
              placeholder="你的 Threads User ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Access Token
            </label>
            <Input
              value={thToken}
              onChange={(e) => setThToken(e.target.value)}
              placeholder="THQAA..."
              type="password"
            />
          </div>
          {thMsg && (
            <p className={`text-sm ${thMsg.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
              {thMsg}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveTh}
              disabled={thSaving || !thUserId || !thToken}
              size="sm"
            >
              {thSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              驗證並儲存
            </Button>
            {conn?.threads.connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect("meta_threads")}
              >
                解除連結
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="rounded-lg border p-6 space-y-3">
        <h2 className="text-lg font-semibold">設定指南</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            前往{" "}
            <a
              href="https://developers.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              Meta Developer Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            建立 App
          </li>
          <li>在 App 中啟用 &quot;Pages API&quot; 和 &quot;Threads API&quot; 產品</li>
          <li>使用 Graph API Explorer 產生 Page Access Token（需 pages_manage_posts 權限）</li>
          <li>使用 Threads API Explorer 產生 Access Token（需 threads_basic, threads_content_publish 權限）</li>
          <li>將 Token 貼到上方對應的欄位並驗證</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Token 有效期通常為 60 天（長效 Token）。過期後需重新產生並更新。
        </p>
      </section>
    </div>
  );
}
