CREATE TABLE `attempt_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`test_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_option` text,
	`marked_for_review` integer DEFAULT false NOT NULL,
	`seconds_spent` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_test_question_idx` ON `attempt_answers` (`test_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `editorial_events` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam` text NOT NULL,
	`year` integer,
	`paper` text,
	`source_question_number` text,
	`subject` text NOT NULL,
	`topic` text NOT NULL,
	`subtopic` text,
	`stem` text NOT NULL,
	`options_json` text NOT NULL,
	`correct_option` text NOT NULL,
	`explanation` text,
	`elimination_notes_json` text,
	`origin` text NOT NULL,
	`source_json` text,
	`source_fingerprint` text NOT NULL,
	`verification_status` text NOT NULL,
	`suggested_difficulty` text,
	`editorial_difficulty` text,
	`workflow_status` text DEFAULT 'draft' NOT NULL,
	`requires_figure` integer DEFAULT false NOT NULL,
	`figure_key` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questions_source_fingerprint_idx` ON `questions` (`source_fingerprint`);--> statement-breakpoint
CREATE TABLE `tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam` text NOT NULL,
	`mode` text NOT NULL,
	`recipe_json` text NOT NULL,
	`question_snapshot_json` text NOT NULL,
	`scoring_json` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`started_at` integer NOT NULL,
	`deadline_at` integer,
	`submitted_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'student' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);