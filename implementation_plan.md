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

---

## 功能優化：Style DNA 動態項目新增

### 目標
讓 Style DNA 除了固定 7 個必填維度外，支援使用者在建立風格時新增自訂維度（選填），AI 會一併從範例中提取這些自訂維度的模式。

### 設計決策

**資料結構：flat key 方案**
- DB 已用 JSONB，直接在同一層存放自訂欄位（不另開巢狀物件）
- TypeScript 用 index signature `[key: string]: string` 讓自訂 key 合法
- 用常數 `REQUIRED_DIMENSION_KEYS` 區分必填 vs 自訂
- 理由：最小改動、prompt 組裝簡單、DB 不需 migration

**自訂維度流程**
1. 建立新風格頁 → 使用者點「新增自訂項目」→ 輸入項目名稱（如「常用句型」）
2. 提交時，自訂項目名稱一起傳給 AI → AI 從範例提取對應模式
3. 儲存到 JSONB 中與 7 個必填維度同層
4. 風格詳情頁自動顯示所有維度（必填 + 自訂），可新增/刪除自訂項

### 改動範圍

| 檔案 | 改動 |
|------|------|
| `src/lib/types/index.ts` | `StyleDimensions` 加 index signature；抽出 `REQUIRED_DIMENSION_KEYS` 常數 |
| `src/app/styles/new/page.tsx` | 新增自訂維度輸入 UI（名稱輸入 + 增刪按鈕） |
| `src/app/styles/actions.ts` | `createStyleAction` 接收 customDimensionNames 並傳遞 |
| `src/lib/anthropic/extract-style.ts` | 接收自訂維度名稱、驗證時只檢查必填項 |
| `src/lib/prompts/extract-style.ts` | prompt 動態加入自訂維度到 JSON 輸出格式 |
| `src/app/styles/[id]/page.tsx` | 詳情頁顯示/編輯自訂維度、支援新增/刪除 |
| `src/lib/prompts/generate-content.ts` | `buildStyleSection` 動態帶入所有維度 |

### 不做的事
- 不改 DB schema（JSONB 天然支援）
- 不加自訂維度排序功能（按插入順序）

---

## 功能優化：批改差異萃取風格

### 目標
使用者手動修改 AI 生成的文案後，可手動觸發 AI 分析修改差異，萃取風格偏好建議，經使用者確認後套用到 Style DNA。

### 設計決策

**觸發方式：手動按鈕**
- 使用者點「分析修改差異」按鈕才觸發 AI 分析
- 按鈕標示「將消耗 AI Token」提醒
- 理由：避免每次小修改都呼叫 AI

**建議處理：使用者確認**
- AI 回傳風格建議清單，每條可勾選
- 使用者選擇後點「套用到 Style DNA」才寫入
- 理由：保持使用者控制權

**原始版本保留**
- `contents` 表新增 `original_body text` 欄位
- 生成/重新生成時同時寫入 `body` + `original_body`
- 需跑 migration 003

### 改動範圍

| 檔案 | 改動 |
|------|------|
| `supabase/migrations/003_content_original_body.sql` | 新增 `original_body` 欄位 |
| `src/lib/types/index.ts` | `Content` 加 `original_body: string \| null` |
| `src/app/episodes/[id]/generate/actions.ts` | 生成時寫入 `original_body`；新增 `analyzeEditDiffAction` + `applyStyleSuggestionsAction` |
| `src/lib/prompts/analyze-edit.ts` | 新檔：`buildAnalyzeEditPrompt` |
| `src/lib/anthropic/analyze-edit.ts` | 新檔：`analyzeEditDiff` + `StyleSuggestion` type |
| `src/components/content/content-editor.tsx` | 分析按鈕 + 建議清單 + 勾選套用 UI |

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
