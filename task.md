# CastFlow Tasks

## Phase 1: 專案初始化與基礎建設
- [x] Create PLAN.md, implementation_plan.md, task.md
- [x] Initialize Next.js 15 project (App Router + TypeScript)
- [x] Install & configure Tailwind CSS + shadcn/ui
- [x] Create Supabase project (DB + Auth + Storage)
- [x] Run initial DB migration (001_initial_schema.sql)
- [x] Set up environment variables (.env.local)
- [x] Create base layout with sidebar navigation
- [ ] Create Meta Developer App (App ID + Secret, OAuth redirect URI)
- [ ] Write Auth architecture planning doc (design only, no implementation)
- [x] Initialize Git repo + create feature branch

## Phase 2: 音訊上傳與轉錄
- [x] Build upload page (drag & drop + progress bar)
- [x] Integrate ffmpeg.wasm for browser-side audio compression (64kbps mono)
- [x] Integrate Supabase Storage (compressed audio upload)
- [x] Create `/api/transcribe` route (Whisper API, auto-chunk if >25MB)
- [x] Store transcription results in `transcripts` table
- [x] Build transcript viewer page (with timestamps)
- [ ] Set up Supabase Realtime for status updates
- [x] Build episodes list page
- [x] Build episode detail page

## Phase 3: AI 文案生成（簡化版）
- [x] Build prompt assembly logic (transcript + fixed prompt → per-platform)
- [x] Create `/api/generate` route (Claude API, 6 platforms in one call)
- [x] Store generated content in `contents` table
- [x] Build content editor with 6 platform tabs
- [x] Implement real-time character count + platform limit warnings
- [x] Build single-platform regeneration feature
- [x] Build one-click copy feature (for IG/LinkedIn/Blog/Newsletter)

## Phase 4: 排程發布 (Threads + FB)
- [x] Build Settings page (Meta token 手動輸入 + 驗證 + 連結狀態 + 設定指南)
- [x] Build Facebook Graph API integration (Page post publishing)
- [x] Build Threads API integration
- [x] Build schedule picker UI (datetime-local selector in content editor)
- [x] Implement publish status tracking (draft → scheduled → published → failed)
- [x] Build error handling + manual retry
- [x] Build schedule calendar page (list view grouped by date)
- [x] Build publish API routes (/api/publish + /api/publish-scheduled)
- [ ] Set up Supabase pg_cron for scheduled publishing (需部署後設定)
- [ ] Run migration 002_settings.sql in Supabase Dashboard
- [ ] Create Meta Developer App + get tokens for testing

## Phase 5: 風格 DNA 系統
- [ ] Build styles list page (CRUD)
- [ ] Build example import UI (paste posts + engagement data)
- [ ] Create `/api/extract-style` route (GPT-4o 7-dimension analysis)
- [ ] Build DNA viewer/editor component
- [ ] Create 3 default platform templates (Threads / FB / General)
- [ ] Build writing rules management (global + per-platform)
- [ ] Build create new style page (full flow: examples → extract → review)
- [ ] Upgrade `/api/generate` to integrate Style DNA (replace fixed prompts)

## Phase 6: Dashboard 與整合
- [ ] Build Dashboard page (recent episodes + weekly schedule)
- [ ] End-to-end happy path testing
- [ ] Error handling for edge cases (token expiry, API failures, etc.)
- [ ] Deploy to Vercel
- [ ] Vercel + Supabase production configuration

## Verification
- [ ] Upload 40-min Chinese podcast → verify compression + transcription quality
- [ ] Generate 6-platform content (fixed prompt) → verify format correctness
- [ ] Schedule + publish to Threads → verify successful post
- [ ] Schedule + publish to FB → verify successful post
- [ ] Extract style DNA from 10+ examples → verify 7-dimension output
- [ ] Upgrade content generation with Style DNA → verify quality improvement
- [ ] Full happy path: upload → compress → transcribe → generate → schedule → publish
- [ ] Create walkthrough.md
