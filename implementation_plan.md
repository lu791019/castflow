# CastFlow Implementation Plan

## Goal Description

打造「CastFlow」— 一個從 Podcast 音訊到社群上架的 AI 內容管線 MVP。
結合 Buffer（排程發布）與 Wrivo（音訊轉文案）的優勢，提供完整閉環：
上傳音訊 → AI 轉錄 → 風格化文案生成（6 平台）→ 排程直發（Threads + FB）。

## User Review Required

> **NOTE**
> - Tech Stack：Next.js 15 (App Router) + Supabase + Tailwind + shadcn/ui
> - LLM：OpenAI Whisper API（轉錄）+ GPT-4o（文案生成）
> - 發布 API：Meta Graph API（FB）+ Threads API
> - 部署：Vercel
> - 風格系統：沿用 dex-agent-os 多層架構（模板→規則→DNA→範例），移至 Phase 5
> - 文案生成 6 平台（Threads/FB/IG/LinkedIn/Blog/Newsletter），排程直發只做 Threads + FB
> - 圖片由用戶手動上傳，不做 AI 生圖
> - MVP 為個人使用，不做多用戶/團隊/付費功能
> - Auth 先規劃不實作，MVP 先跑通核心流程
> - 音訊壓縮使用瀏覽器端 ffmpeg.wasm（64kbps mono，Whisper API 限 25MB）
> - 排程使用 Supabase pg_cron（取代 Vercel Cron，支援分鐘級觸發）
> - Phase 順序調整：P1 初始化 → P2 音訊轉錄 → P3 文案生成（簡化版）→ P4 排程發布 → P5 風格 DNA → P6 整合

## Proposed Changes

### Project Structure

```
social-media-product/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 根 layout
│   │   ├── page.tsx                  # Dashboard
│   │   ├── (auth)/                  # [DEFERRED] Auth 先規劃，MVP 不實作
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts     # Supabase Auth callback
│   │   ├── episodes/
│   │   │   ├── page.tsx              # 集數列表
│   │   │   ├── new/page.tsx          # 上傳新音訊
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 單集詳情
│   │   │       ├── generate/page.tsx # AI 文案生成
│   │   │       └── edit/page.tsx     # 內容編輯器
│   │   ├── schedule/
│   │   │   └── page.tsx              # 排程行事曆
│   │   ├── styles/
│   │   │   ├── page.tsx              # 風格管理列表
│   │   │   ├── new/page.tsx          # 建立新風格
│   │   │   └── [id]/page.tsx         # 檢視/編輯風格 DNA
│   │   ├── settings/
│   │   │   └── page.tsx              # 設定（Meta 連結狀態 + Token 管理 + 設定指南）
│   │   └── api/
│   │       ├── upload/route.ts       # 音訊上傳
│   │       ├── transcribe/route.ts   # Whisper 轉錄
│   │       ├── generate/route.ts     # AI 文案生成
│   │       ├── extract-style/route.ts # 風格 DNA 提取
│   │       ├── publish/route.ts      # 手動發布
│   │       ├── schedule/route.ts     # 排程管理
│   │       ├── cron/publish/route.ts # pg_cron 觸發排程發布
│   │       └── auth/
│   │           ├── meta/route.ts     # Meta OAuth
│   │           └── callback/route.ts # Meta OAuth callback
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 元件
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # 側邊導覽
│   │   │   └── header.tsx            # 頂部導覽
│   │   ├── episodes/
│   │   │   ├── upload-form.tsx       # 上傳表單
│   │   │   ├── episode-card.tsx      # 集數卡片
│   │   │   └── transcript-viewer.tsx # 逐字稿檢視器
│   │   ├── content/
│   │   │   ├── platform-tabs.tsx     # 6 平台 tab
│   │   │   ├── content-editor.tsx    # 文案編輯器
│   │   │   └── platform-preview.tsx  # 平台預覽
│   │   ├── schedule/
│   │   │   ├── calendar-view.tsx     # 月曆視圖
│   │   │   └── schedule-picker.tsx   # 日期時間選擇器
│   │   └── styles/
│   │       ├── style-card.tsx        # 風格卡片
│   │       ├── example-input.tsx     # 範例匯入
│   │       └── dna-viewer.tsx        # DNA 檢視器
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase 瀏覽器端 client
│   │   │   ├── server.ts             # Supabase 伺服器端 client
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── openai/
│   │   │   ├── whisper.ts            # Whisper API 封裝
│   │   │   └── generate.ts           # GPT-4o 文案生成封裝
│   │   ├── meta/
│   │   │   ├── graph-api.ts          # Facebook Graph API
│   │   │   └── threads-api.ts        # Threads API
│   │   ├── prompts/
│   │   │   ├── extract-style.ts      # 風格 DNA 提取 prompt
│   │   │   └── generate-content.ts   # 文案生成 prompt 組裝
│   │   └── types/
│   │       └── index.ts              # TypeScript 型別定義
│   └── hooks/
│       ├── use-episode.ts            # 集數相關 hooks
│       └── use-realtime.ts           # Supabase Realtime hooks
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # 資料庫 schema
├── public/
├── PLAN.md
├── implementation_plan.md
├── task.md
└── CLAUDE.md
```

### Components

- `[NEW] src/app/layout.tsx`
  根 layout，包含 sidebar 導覽、Supabase Auth provider

- `[NEW] src/app/page.tsx`
  Dashboard，顯示最近集數 + 本週排程概覽

- `[NEW] src/app/episodes/` (全部頁面)
  集數管理：列表、上傳、詳情、生成、編輯

- `[NEW] src/app/schedule/page.tsx`
  排程行事曆（月曆 + 列表雙視圖）

- `[NEW] src/app/styles/` (全部頁面)
  風格 DNA 管理：列表、建立、檢視/編輯

- `[NEW] src/app/api/transcribe/route.ts`
  Whisper API 串接，接收音訊 URL → 回傳轉錄結果

- `[NEW] src/app/api/generate/route.ts`
  GPT-4o 文案生成，接收逐字稿 + 風格 DNA → 回傳 6 平台文案

- `[NEW] src/app/api/extract-style/route.ts`
  風格 DNA 提取，接收範例文案 → 回傳 7 維度分析結果

- `[NEW] src/app/api/cron/publish/route.ts`
  Supabase pg_cron 觸發，掃描到期排程 → 呼叫 Meta API 發布

- `[NEW] src/lib/openai/whisper.ts`
  Whisper API 封裝，處理音訊轉錄

- `[NEW] src/lib/openai/generate.ts`
  GPT-4o 封裝，組裝 prompt（逐字稿 + DNA + 規則）→ 生成文案

- `[NEW] src/lib/meta/graph-api.ts`
  Facebook Graph API 封裝（FB Page 發布）

- `[NEW] src/lib/meta/threads-api.ts`
  Threads API 封裝

- `[NEW] src/lib/prompts/extract-style.ts`
  風格 DNA 提取的 system prompt（7 維度分析指令）

- `[NEW] src/lib/prompts/generate-content.ts`
  文案生成的 prompt 組裝邏輯（逐字稿 + DNA + 規則 + 平台要求）

- `[NEW] src/components/content/platform-tabs.tsx`
  6 平台 tab 切換，Threads/FB 有排程按鈕，其他只有複製

- `[NEW] src/components/content/content-editor.tsx`
  文案編輯器，即時字數計數 + 平台限制提醒

- `[NEW] src/components/styles/dna-viewer.tsx`
  風格 DNA 7 維度視覺化檢視器

- `[NEW] src/app/settings/page.tsx`
  Settings 頁面：Meta 帳號連結狀態 Dashboard、Token 到期提醒、重新授權按鈕、折疊式設定指南

- `[NEW] supabase/migrations/001_initial_schema.sql`
  完整資料庫 schema（8 張表）

## Verification Plan

### Manual Verification
- 上傳一段 40 分鐘的中文 Podcast MP3 → 確認轉錄完成且品質合格
- 使用轉錄結果 + 風格 DNA → 一鍵生成 6 平台文案 → 確認各平台文案格式正確
- 編輯 Threads 文案 → 設定排程時間 → 確認成功發布到 Threads
- 編輯 FB 文案 → 設定排程時間 → 確認成功發布到 FB Page
- 貼入 10 篇範例文案 → 提取風格 DNA → 確認 7 維度分析結果合理
- 複製 IG/LinkedIn/Blog/Newsletter 文案 → 確認內容格式正確

### Automated Tests
- API Route 單元測試：upload、transcribe、generate、publish
- 風格 DNA 提取 prompt 輸出格式驗證
- Meta API 發布 mock 測試
- 排程 Cron 觸發邏輯測試
- 資料庫 schema migration 測試
