# CastFlow

**從 Podcast 音訊到社群貼文的 AI 內容管線。**

一條龍閉環：上傳音訊 → AI 轉錄 → AI 風格化文案生成（6 平台）→ 排程直發（Threads + Facebook）

## 為什麼做這個

市場上的工具要嘛只做排程（Buffer）、要嘛只做音訊轉文字（Podwise），沒有一個產品能把「音訊 → AI 文案 → 直接發布」串成完整閉環。CastFlow 填補這個缺口，讓 Podcast 創作者不再需要在多個工具間切換。

### 目標用戶

- Podcast 創作者，每週 1-2 集
- 需要將音訊內容快速轉化為多平台社群文案
- 繁體中文為主要語言

## 核心功能

| 功能 | 說明 |
|------|------|
| 音訊上傳 | 支援 MP3 / WAV / M4A / AAC，瀏覽器端自動壓縮至 ≤25MB |
| AI 轉錄 | Groq Whisper（whisper-large-v3-turbo），帶時間軸 |
| AI 文案生成 | 同時產出 6 平台文案：Threads、Facebook、Instagram、LinkedIn、Blog、Newsletter |
| 風格 DNA | 從你的歷史貼文提取 7 維度風格特徵，生成文案自動套用你的語氣 |
| 排程直發 | Threads + Facebook 透過 Meta API 自動發布 |
| 一鍵複製 | IG、LinkedIn、Blog、Newsletter 快速複製手動發布 |
| Dashboard | 統計總覽 + 排程行事曆 |

## 系統架構

```
使用者
  │
  ▼
┌─────────────────────────────────┐
│  Next.js 15 (App Router)        │
│  前端 UI + API Routes           │
└──────┬──────┬──────┬──────┬─────┘
       │      │      │      │
       ▼      ▼      ▼      ▼
  Supabase  Groq    Claude  Meta
  Storage   Whisper  CLI    Graph API
  (音訊)   (轉錄)  (文案)  (發布)
       │
       ▼
  Supabase PostgreSQL
  (資料庫 + pg_cron 排程)
```

### 技術選型

| 層級 | 選擇 | 理由 |
|------|------|------|
| 前端 | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui | SSR + API Routes 一體，快速開發 |
| 後端 | Next.js API Routes | MVP 不需獨立後端服務 |
| 資料庫 | Supabase (PostgreSQL) | DB + Storage + Auth 一站式 |
| 音訊儲存 | Supabase Storage | 直接上傳，免設定 S3 |
| 音訊壓縮 | ffmpeg.wasm（瀏覽器端） | 壓至 64kbps mono 16kHz，確保 ≤25MB |
| 轉錄 | Groq Whisper API (whisper-large-v3-turbo) | 速度極快，免費額度足夠 |
| 文案生成 | `claude --print` CLI | 走 Claude Pro/Max 額度，零 API 費用 |
| 排程發布 | Meta Graph API + Threads API | Threads + FB 直發 |
| 排程觸發 | Supabase pg_cron | 分鐘級排程，免費方案即可 |
| 部署 | Vercel | Next.js 原生整合 |

## 資料流程

```
1. 上傳音訊
   使用者選擇檔案 → ffmpeg.wasm 瀏覽器端壓縮 → 上傳至 Supabase Storage → 建立 episode 記錄

2. AI 轉錄
   上傳完成自動觸發 → 從 Storage 取得音訊 → Groq Whisper 轉錄 → 存入 transcripts 表（含逐段時間軸）

3. AI 文案生成
   選擇集數 + 風格（可選）→ claude --print 根據逐字稿 + 風格 DNA 生成 6 平台文案 → 存入 contents 表

4. 編輯與發布
   6 平台 Tab 檢視/編輯 → 設定排程時間或立即發布 → Meta API 發送至 Threads / Facebook
   → 其他平台一鍵複製手動發布
```

## 風格 DNA 系統

從你的歷史貼文中 AI 提取 7 個維度的風格特徵：

1. **結構模式** — Hook → 條列 → 金句
2. **開場 Hook** — 反差型 / 提問型 / 宣告型 / 共感型
3. **語氣特徵** — 口語比例、用字習慣、人稱用法
4. **CTA / 收尾模式** — 行動呼籲的慣用方式
5. **長度 / 格式** — 字數分布、emoji 使用量
6. **高互動特徵** — 從歷史數據回推
7. **禁忌** — 明確避免的表達模式

貼入至少 3 篇歷史貼文（含互動數據），AI 自動分析產出風格 DNA，後續生成文案時自動套用。

## 頁面結構

```
/                        → Dashboard（統計數據 + 最近集數 + 排程概覽）
/episodes                → 集數列表
/episodes/new            → 上傳新音訊
/episodes/[id]           → 單集詳情（逐字稿 + 已生成內容）
/episodes/[id]/generate  → AI 文案生成
/episodes/[id]/edit      → 內容編輯器（6 平台 Tab）
/schedule                → 排程行事曆
/styles                  → 風格 DNA 管理
/styles/new              → 建立新風格（貼入範例 → 提取 DNA）
/styles/[id]             → 查看 / 編輯風格 DNA
/settings                → Meta 帳號連結 + Token 管理
```

## 資料庫結構

共 9 張表：

| 表名 | 用途 |
|------|------|
| `episodes` | 集數（標題、音訊 URL、狀態） |
| `transcripts` | 逐字稿（全文 + 逐段時間軸 JSON） |
| `writing_rules` | 寫作規則（通用 + 各平台） |
| `style_dnas` | 風格 DNA（7 維度 JSON） |
| `style_examples` | 風格範例庫（貼文 + 互動數據） |
| `platform_templates` | 平台模板（system prompt + 格式規則） |
| `contents` | 生成的文案（平台、內容、排程、狀態） |
| `publish_logs` | 發布紀錄（API 回應、成功/失敗） |
| `settings` | 系統設定（Meta Token 等 key-value） |

## 快速開始

### 前置需求

- Node.js 18+
- Supabase 專案（[supabase.com](https://supabase.com)）
- Groq API Key（[console.groq.com](https://console.groq.com)）
- Claude CLI（`claude --print` 用於文案生成）
- Meta Developer App（發布用，可稍後設定）

### 安裝

```bash
git clone https://github.com/lu791019/castflow.git
cd castflow
npm install
```

### 環境變數

建立 `.env.local`：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq（轉錄用）
GROQ_API_KEY=your-groq-api-key

# API 保護（自訂密鑰）
API_SECRET_KEY=your-secret-key
```

### 資料庫初始化

在 Supabase SQL Editor 中依序執行：

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_settings.sql
```

### 啟動開發伺服器

```bash
npm run dev
```

開啟 http://localhost:3000

### 建置與生產環境

```bash
npm run build
npm start
```

## API Routes

| 路徑 | 方法 | 說明 | 驗證 |
|------|------|------|------|
| `/api/transcribe` | POST | 觸發音訊轉錄 | `x-api-key` |
| `/api/generate` | POST | 觸發 AI 文案生成 | `x-api-key` |
| `/api/publish` | POST | 發布單篇文案 | `x-api-key` |
| `/api/publish-scheduled` | POST | 發布所有到期排程 | `x-api-key` |

所有 API 透過 `x-api-key` header 驗證，值為環境變數 `API_SECRET_KEY`。

## 專案結構

```
src/
├── app/                          # Next.js App Router 頁面
│   ├── api/                      # API Routes
│   │   ├── generate/route.ts     # 文案生成
│   │   ├── transcribe/route.ts   # 音訊轉錄
│   │   ├── publish/route.ts      # 單篇發布
│   │   └── publish-scheduled/    # 排程發布
│   ├── episodes/                 # 集數管理頁面
│   ├── schedule/                 # 排程行事曆
│   ├── settings/                 # 設定（Meta Token）
│   └── styles/                   # 風格 DNA 管理
├── components/
│   ├── content/                  # 文案編輯器元件
│   ├── episodes/                 # 上傳表單、轉錄觸發元件
│   ├── layout/                   # Sidebar 佈局
│   └── ui/                       # shadcn/ui 基礎元件
└── lib/
    ├── anthropic/                # Claude CLI 客戶端 + 文案生成
    ├── audio/                    # ffmpeg.wasm 音訊壓縮
    ├── meta/                     # Meta Graph API（FB + Threads）
    ├── openai/                   # Groq Whisper 轉錄
    ├── prompts/                  # AI prompt 模板
    ├── supabase/                 # Supabase 客戶端（client/server/admin）
    └── types/                    # TypeScript 型別定義
```

## 費用估算（每月，1-2 集/週）

| 項目 | 費用 |
|------|------|
| Groq Whisper | 免費額度內 |
| Claude 文案生成 | 走 Pro/Max 額度，零額外費用 |
| Supabase | Free tier |
| Vercel | Free tier |
| **月總計** | **~$0**（Pro 訂閱費用除外） |

## 開發狀態

- [x] Phase 1 — 專案初始化（Next.js + Supabase + shadcn/ui）
- [x] Phase 2 — 音訊上傳與轉錄
- [x] Phase 3 — AI 文案生成
- [x] Phase 4 — 排程發布（Threads + Facebook）
- [x] Phase 5 — 風格 DNA 系統
- [x] Phase 6 — Dashboard 統計總覽
- [ ] Vercel 部署
- [ ] Meta Developer App 設定
- [ ] Supabase pg_cron 排程設定

## 已知限制

- `claude --print` 依賴本地 CLI，Vercel serverless 無法使用 → 部署時需改用 Anthropic API
- 音訊單檔限 25MB（Whisper API 限制），超過需先壓縮
- 排程發布依賴 Supabase pg_cron，需另行設定
- Meta API Token 需手動取得並貼入 Settings 頁面
- 目前無用戶認證系統，API 僅靠 `x-api-key` 保護

## License

Private — All rights reserved.
