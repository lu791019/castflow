-- Add original_body to contents for diff-based style extraction
alter table contents add column if not exists original_body text;
