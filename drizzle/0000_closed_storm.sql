CREATE TABLE `completions` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`run_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`request_body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reward` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `completions_run_id_unique` ON `completions` (`run_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `completions_idempotency_key_unique` ON `completions` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_completions_player_created` ON `completions` (`player_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_subject_unique` ON `players` (`subject`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`level_id` text NOT NULL,
	`rules_version` integer NOT NULL,
	`state` text NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`last_digest` text,
	`completion_id` text NOT NULL,
	`status` text DEFAULT 'playing' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `runs_completion_id_unique` ON `runs` (`completion_id`);--> statement-breakpoint
CREATE INDEX `idx_runs_player_created` ON `runs` (`player_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
