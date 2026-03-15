# CastFlow — 專案計畫

## §1 專案願景

**CastFlow** — 從 Podcast 音訊到社群上架的 AI 內容管線。

結合 Buffer（排程發布）與 Wrivo（音訊轉文案）的優勢，打造完整閉環：
上傳音訊 → AI 轉錄 → AI 風格化文案生成（6 平台）→ 排程直發（Threads + FB）

### 核心差異化
- 市場上沒有「音訊 → AI 文案 → 直接發布」的完整閉環產品
- 數據驅動的風格 DNA 系統（參考 dex-agent-os 設計）
- 先服務自己（Podcast 創作者），dog-fooding 驗證

### 目標用戶（MVP）
- Podcast 創作者，每週 1-2 集，繁體中文為主
- 需要將音訊內容轉化為多平台社群文案

---

## §2 系統架構

```
Frontend (Next.js 15 App Router + Tailwind + shadcn/ui)
    ↓
Next.js API Routes (Backend)
    ↓
┌────────────┬────────────┬────────────┬─────────────┐
│ Supabase   │ OpenAI     │ OpenAI     │ Meta        │
│ Storage    │ Whisper    │ GPT-4o     │ Graph API   │
│ (音訊)     │ (轉錄)     │ (文案生成)  │ Threads+FB  │
└────────────┴────────────┴────────────┴─────────────┘
    ↓
Supabase (PostgreSQL + Auth + Realtime)
```

### 技術選型

| 層級 | 選擇 | 理由 |
|------|------|------|
| Frontend | Next.js 15 (App Router) | SSR + API Routes 一體 |
| UI | Tailwind + shadcn/ui | 快速開發、元件品質高 |
| 後端 | Next.js API Routes | MVP 不需獨立後端 |
| DB + Auth | Supabase | PostgreSQL + Auth + Storage 一站式 |
| 音訊儲存 | Supabase Storage | 直接上傳，省去 S3 設定 |
| 音訊壓縮 | ffmpeg.wasm（瀏覽器端） | 壓縮至 64kbps mono，確保 ≤25MB 送 Whisper |
| 轉錄 | OpenAI Whisper API | 品質最佳，支援中英文，單檔限 25MB |
| 文案生成 | OpenAI GPT-4o | 成本/品質平衡 |
| 排程發布 | Meta Graph API + Threads API | Threads + FB 直發 |
| 部署 | Vercel | Next.js 原生整合 |
| 背景任務 | Supabase pg_cron + Edge Functions | 分鐘級排程，免費方案即可 |

---

## §3 資料模型

```sql
-- 集數
episodes (id, title, audio_url, duration_seconds, status, created_at, user_id)

-- 轉錄稿
transcripts (id, episode_id, full_text, segments jsonb, language, created_at)

-- 寫作規則
writing_rules (id, name, scope, platform, content, user_id, created_at)

-- 風格 DNA
style_dnas (id, name, platform, dimensions jsonb, source_example_count, extracted_at, user_id)

-- 範例庫
style_examples (id, style_dna_id, platform, content, engagement jsonb, performance_tier, published_at, user_id)

-- 平台模板
platform_templates (id, platform, name, system_prompt, format_rules, user_id, created_at)

-- 生成的內容
contents (id, episode_id, style_dna_id, platform, body, media_urls jsonb, status, scheduled_at, published_at, user_id)

-- 發布紀錄
publish_logs (id, content_id, platform, platform_post_id, response jsonb, status, error_message, created_at)
```

---

## §4 風格 DNA 系統

沿用 dex-agent-os 的多層風格架構：

```
Layer 4: 範例庫 — 真實已發布文案 + 互動數據
Layer 3: 風格 DNA — AI 從範例提取的 7 維度抽象模式
Layer 2: 寫作規則 — 通用風格規則 + 各頻道規則
Layer 1: 平台模板 — 最小結構框架 + system prompt
```

### 風格 DNA 7 維度
1. 結構模式（Hook → 條列 → 金句）
2. 開場 Hook 模式（反差型/提問型/宣告型/共感型）
3. 語氣特徵（口語比例、用字習慣、人稱用法）
4. CTA / 收尾模式
5. 長度 / 格式（字數分布、emoji 使用）
6. 高互動特徵（從數據回推）
7. 禁忌（明確避免的模式）

### 風格演化
初始範例(10+篇) → 提取 v1 DNA → 使用產出 → 回填互動數據 → 重新提取 → v2 DNA

---

## §5 功能範圍

### MVP 包含

| 功能 | 說明 |
|------|------|
| 音訊上傳 | MP3/WAV/M4A/AAC，≤200MB，瀏覽器端 ffmpeg.wasm 壓縮至 ≤25MB |
| AI 轉錄 | Whisper API，帶時間軸 + 講者標籤 |
| AI 文案生成 | 6 平台：Threads、FB、IG、LinkedIn、Blog、Newsletter |
| 風格 DNA 提取 | 貼入範例 + 互動數據 → AI 提取 7 維度 |
| 內容編輯器 | 6 平台 tab，各自預覽/編輯/重新生成 |
| 排程直發 | Threads + FB，透過 Meta API |
| 一鍵複製 | IG、LinkedIn、Blog、Newsletter（手動發布） |
| 排程行事曆 | 月曆 + 列表視圖 |

### MVP 不做
- 影片轉錄
- YouTube / X / Pinterest 等其他平台直發
- 團隊協作/審批流程
- 數據分析儀表板
- 付費/訂閱系統
- Mobile app
- 完整用戶認證系統（Auth 先規劃，不實作）

---

## §6 頁面結構

```
/                        → Dashboard（最近集數 + 排程概覽）
/episodes                → 集數列表
/episodes/new            → 上傳新音訊
/episodes/[id]           → 單集詳情（轉錄稿 + 已生成內容）
/episodes/[id]/generate  → AI 文案生成
/episodes/[id]/edit      → 內容編輯器（6 平台 tab）
/schedule                → 排程行事曆
/styles                  → 風格管理
/styles/new              → 建立新風格（貼入範例 → 提取 DNA）
/styles/[id]             → 查看/編輯風格 DNA
/settings                → Meta 帳號連結、連線狀態、Token 管理、設定指南
```

---

## §7 API 費用估算（每月，以 1-2 集/週計算）

| 項目 | 估算 |
|------|------|
| Whisper 轉錄 | ~$0.48-0.96（$0.006/min × 40min × 4-8集） |
| GPT-4o 文案生成 | ~$0.40-0.80（每集 6 平台） |
| Supabase | Free tier（足夠 MVP） |
| Vercel | Free tier（足夠 MVP） |
| **月總計** | **~$1-2** |

---

## §8 實作階段

### Phase 1：專案初始化與基礎建設 ✅
- [x] Next.js 15 專案初始化（App Router + Tailwind + shadcn/ui）
- [x] Supabase 專案建立（DB + Auth + Storage）
- [x] 資料庫 schema 建立（全部 tables）
- [x] 基礎 layout 與路由結構
- [ ] Meta Developer App 建立（取得 App ID + Secret，設定 OAuth redirect）
- [ ] Auth 架構規劃文件（暫不實作，產出設計文件供未來開發）

### Phase 2：音訊上傳與轉錄 🔲 (Realtime 待補)
- [x] 音訊上傳頁面（拖拉上傳 + 進度條）
- [x] 瀏覽器端 ffmpeg.wasm 音訊壓縮（64kbps mono，確保 ≤25MB）
- [x] Supabase Storage 整合
- [x] Whisper API 串接（API Route，含超過 25MB 自動分段）
- [x] 轉錄結果存入 DB
- [x] 轉錄稿檢視頁面（帶時間軸）
- [ ] 即時狀態更新（Supabase Realtime）

### Phase 3：AI 文案生成（簡化版）🔲
- [ ] 文案生成 API Route（逐字稿 + 固定 prompt → 6 平台文案）
- [ ] 生成結果存入 contents 表
- [ ] 內容編輯器（6 平台 tab）
- [ ] 即時字數計數 + 平台限制提醒
- [ ] 單平台重新生成功能
- [ ] 一鍵複製文案功能

### Phase 4：排程發布（Threads + FB）🔲
- [ ] Meta OAuth 串接（連結 FB Page + Threads）
- [ ] Meta Graph API 串接（FB Page 發布）
- [ ] Threads API 串接
- [ ] 排程選擇 UI（日期時間選擇器）
- [ ] Supabase pg_cron 排程觸發器
- [ ] 發布狀態追蹤 + 錯誤處理
- [ ] 排程行事曆頁面
- [ ] Settings 頁面（Meta 帳號連結狀態 + Token 到期提醒 + 設定指南）

### Phase 5：風格 DNA 系統 🔲
- [ ] 風格管理頁面（CRUD）
- [ ] 範例匯入介面（貼入文案 + 互動數據）
- [ ] 風格 DNA 提取 API（GPT-4o 7 維度分析）
- [ ] DNA 檢視/編輯介面
- [ ] 3 個預設平台模板（Threads / FB / 通用）
- [ ] 文案生成 API 整合風格 DNA（升級 Phase 3 的固定 prompt）

### Phase 6：Dashboard 與整合 🔲
- [ ] Dashboard 頁面（最近集數 + 本週排程）
- [ ] 完整 Happy Path 端到端測試
- [ ] 錯誤處理與邊界情境
- [ ] 部署到 Vercel

---

## §9 關鍵決策紀錄

| 日期 | 決策 | 理由 |
|------|------|------|
| 2026-03-13 | 選擇方向 A「AI Content Pipeline」 | 一條龍閉環，市場無直接競品 |
| 2026-03-13 | 文案生成 6 平台，排程直發只做 Threads + FB | 控制工程量，IG API 審核嚴格後期再加 |
| 2026-03-13 | 風格系統沿用 dex-agent-os 多層架構 | 已在真實場景驗證，數據驅動 |
| 2026-03-13 | 圖片由用戶手動上傳，不做 AI 生圖 | MVP 簡化，聚焦核心流程 |
| 2026-03-13 | GPT-4o 為主力 LLM | 成本低、速度快，MVP 足夠 |
| 2026-03-15 | 風格 DNA 系統移至 Phase 5 | 先跑通基本流程（上傳→轉錄→生成→發布），再疊加風格系統 |
| 2026-03-15 | 排程改用 Supabase pg_cron | Vercel Hobby Cron 最小間隔每天一次，不足以支援分鐘級排程 |
| 2026-03-15 | 音訊壓縮用瀏覽器端 ffmpeg.wasm | Whisper API 限 25MB，避免 Vercel serverless 限制 |
| 2026-03-15 | Auth 先規劃不實作 | MVP 個人使用，先跑通核心流程 |
| 2026-03-15 | Meta Developer App 在 Phase 1 建立 | 避免 Phase 4 才發現前置作業未完成 |

---

## §10 未來擴展方向

- 更多平台直發（IG、LinkedIn、X）
- 影片/YouTube 來源支援
- AI 生成配圖（模板 or DALL-E）
- 數據分析儀表板（哪種內容在哪個平台表現最好）
- 團隊協作 + 客戶管理（代操場景）
- 付費訂閱系統
- Mobile app
- 完整用戶認證系統（Supabase Auth）
