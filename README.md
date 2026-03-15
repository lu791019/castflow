# CastFlow

From Podcast audio to social media — an AI-powered content pipeline.

## What is CastFlow?

CastFlow automates the journey from podcast episodes to social media posts:

**Upload Audio → AI Transcription → AI Content Generation (6 platforms) → Scheduled Publishing (Threads + FB)**

## Features (MVP)

- **Audio Upload & Transcription** — Whisper API with timestamps, browser-side compression via ffmpeg.wasm
- **AI Content Generation** — GPT-4o generates platform-specific posts for Threads, FB, IG, LinkedIn, Blog, Newsletter
- **Style DNA System** — 7-dimension style extraction from your existing posts for consistent voice
- **Scheduled Publishing** — Direct posting to Threads and Facebook via Meta API
- **One-click Copy** — Quick copy for platforms without direct API integration
- **Schedule Calendar** — Month and list view for content planning

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Transcription | OpenAI Whisper API |
| Content Generation | OpenAI GPT-4o |
| Publishing | Meta Graph API + Threads API |
| Scheduling | Supabase pg_cron + Edge Functions |
| Deployment | Vercel |

## Project Status

🚧 **In Development** — Currently in planning phase.

See [PLAN.md](PLAN.md) for full project plan and architecture details.

## License

Private — All rights reserved.
