ALTER TABLE `questions` ADD `prompt_lines_json` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `source_text_hash` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `source_text_locked` integer DEFAULT true NOT NULL;