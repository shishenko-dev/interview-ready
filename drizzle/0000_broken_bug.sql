CREATE TABLE `practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`vacancy_id` text,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`score` integer NOT NULL,
	`relevance` integer NOT NULL,
	`specificity` integer NOT NULL,
	`ownership` integer NOT NULL,
	`result_focus` integer NOT NULL,
	`feedback_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `practice_vacancy_created_idx` ON `practice_sessions` (`vacancy_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `practice_created_at_idx` ON `practice_sessions` (`created_at`);--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`competency` text NOT NULL,
	`situation` text NOT NULL,
	`task` text NOT NULL,
	`action` text NOT NULL,
	`result` text NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`proof` text DEFAULT '' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stories_competency_idx` ON `stories` (`competency`);--> statement-breakpoint
CREATE TABLE `vacancies` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`source_text` text DEFAULT '' NOT NULL,
	`url` text,
	`stage` text DEFAULT 'Новая' NOT NULL,
	`fit_score` integer DEFAULT 50 NOT NULL,
	`salary` text,
	`work_format` text,
	`summary` text DEFAULT '' NOT NULL,
	`strengths_json` text DEFAULT '[]' NOT NULL,
	`gaps_json` text DEFAULT '[]' NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`next_actions_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vacancies_updated_at_idx` ON `vacancies` (`updated_at`);--> statement-breakpoint
CREATE INDEX `vacancies_stage_idx` ON `vacancies` (`stage`);--> statement-breakpoint
PRAGMA optimize;
