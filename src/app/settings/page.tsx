"use client";

import { useState, useEffect } from "react";
import {
  getMetaConnectionStatus,
  saveFacebookSettings,
  saveThreadsSettings,
  disconnectPlatform,
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

  useEffect(() => {
    getMetaConnectionStatus().then((status) => {
      setConn(status as ConnectionState);
      setLoading(false);
    });
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
