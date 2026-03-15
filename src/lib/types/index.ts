export type EpisodeStatus = "uploading" | "uploaded" | "transcribing" | "transcribed" | "error";

export type ContentStatus = "draft" | "scheduled" | "published" | "failed";

export type PublishStatus = "pending" | "success" | "failed";

export type Platform = "threads" | "facebook" | "instagram" | "linkedin" | "blog" | "newsletter";

export interface Episode {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number | null;
  status: EpisodeStatus;
  created_at: string;
  user_id: string;
}

export interface Transcript {
  id: string;
  episode_id: string;
  full_text: string;
  segments: TranscriptSegment[];
  language: string;
  created_at: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface StyleDna {
  id: string;
  name: string;
  platform: Platform;
  dimensions: StyleDimensions;
  source_example_count: number;
  extracted_at: string;
  user_id: string;
}

export interface StyleDimensions {
  structure_pattern: string;
  hook_pattern: string;
  tone_features: string;
  cta_pattern: string;
  format_specs: string;
  high_engagement_features: string;
  taboos: string;
}

export interface Content {
  id: string;
  episode_id: string;
  style_dna_id: string | null;
  platform: Platform;
  body: string;
  media_urls: string[];
  status: ContentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  user_id: string;
}

export interface PublishLog {
  id: string;
  content_id: string;
  platform: Platform;
  platform_post_id: string | null;
  response: Record<string, unknown> | null;
  status: PublishStatus;
  error_message: string | null;
  created_at: string;
}
