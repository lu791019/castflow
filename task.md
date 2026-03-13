# CastFlow Tasks

## Project Initialization
- [ ] Create PLAN.md, implementation_plan.md, task.md
- [ ] Initialize Next.js 15 project (App Router + TypeScript)
- [ ] Install & configure Tailwind CSS + shadcn/ui
- [ ] Create Supabase project (DB + Auth + Storage)
- [ ] Run initial DB migration (001_initial_schema.sql)
- [ ] Set up environment variables (.env.local)
- [ ] Create base layout with sidebar navigation
- [ ] Set up Supabase Auth (login/logout/callback)
- [ ] Initialize Git repo + create feature branch

## Phase 2: 音訊上傳與轉錄
- [ ] Build upload page (drag & drop + progress bar)
- [ ] Integrate Supabase Storage (audio file upload)
- [ ] Create `/api/transcribe` route (Whisper API integration)
- [ ] Store transcription results in `transcripts` table
- [ ] Build transcript viewer page (with timestamps)
- [ ] Set up Supabase Realtime for status updates
- [ ] Build episodes list page
- [ ] Build episode detail page

## Phase 3: 風格 DNA 系統
- [ ] Build styles list page (CRUD)
- [ ] Build example import UI (paste posts + engagement data)
- [ ] Create `/api/extract-style` route (GPT-4o 7-dimension analysis)
- [ ] Build DNA viewer/editor component
- [ ] Create 3 default platform templates (Threads / FB / General)
- [ ] Build writing rules management (global + per-platform)
- [ ] Build create new style page (full flow: examples → extract → review)

## Phase 4: AI 文案生成
- [ ] Build prompt assembly logic (transcript + DNA + rules → per-platform)
- [ ] Create `/api/generate` route (GPT-4o, 6 platforms in one call)
- [ ] Store generated content in `contents` table
- [ ] Build content editor with 6 platform tabs
- [ ] Implement real-time character count + platform limit warnings
- [ ] Build single-platform regeneration feature
- [ ] Build one-click copy feature (for IG/LinkedIn/Blog/Newsletter)
- [ ] Build image upload for IG tab

## Phase 5: 排程發布 (Threads + FB)
- [ ] Set up Meta Developer App + permissions
- [ ] Implement Meta OAuth flow (connect FB Page + Threads)
- [ ] Build Facebook Graph API integration (Page post publishing)
- [ ] Build Threads API integration
- [ ] Build schedule picker UI (date + time selector)
- [ ] Create `/api/cron/publish` route (Vercel Cron trigger)
- [ ] Implement publish status tracking (draft → scheduled → published → failed)
- [ ] Build error handling + manual retry
- [ ] Build schedule calendar page (month + list view)

## Phase 6: Dashboard 與整合
- [ ] Build Dashboard page (recent episodes + weekly schedule)
- [ ] End-to-end happy path testing
- [ ] Error handling for edge cases (token expiry, API failures, etc.)
- [ ] Settings page (Meta account connection, preferences)
- [ ] Deploy to Vercel
- [ ] Vercel Cron job configuration

## Verification
- [ ] Upload 40-min Chinese podcast → verify transcription quality
- [ ] Generate 6-platform content → verify format correctness
- [ ] Schedule + publish to Threads → verify successful post
- [ ] Schedule + publish to FB → verify successful post
- [ ] Extract style DNA from 10+ examples → verify 7-dimension output
- [ ] Full happy path: upload → transcribe → generate → schedule → publish
- [ ] Create walkthrough.md
