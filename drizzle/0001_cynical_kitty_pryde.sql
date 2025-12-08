CREATE TABLE `concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`original_concept` text NOT NULL,
	`refined_concept` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concepts_slug_unique` ON `concepts` (`slug`);--> statement-breakpoint
CREATE INDEX `concepts_slug_idx` ON `concepts` (`slug`);--> statement-breakpoint
CREATE INDEX `concepts_status_idx` ON `concepts` (`status`);--> statement-breakpoint
CREATE INDEX `concepts_user_id_idx` ON `concepts` (`user_id`);--> statement-breakpoint
CREATE TABLE `lineage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`paper_id` integer NOT NULL,
	`ancestor_paper_id` integer,
	`mutation_type` text NOT NULL,
	`mutation_description` text,
	`era` text,
	`influence_score` real,
	`position_x` real,
	`position_y` real,
	`created_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ancestor_paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lineage_concept_id_idx` ON `lineage` (`concept_id`);--> statement-breakpoint
CREATE INDEX `lineage_paper_id_idx` ON `lineage` (`paper_id`);--> statement-breakpoint
CREATE INDEX `lineage_ancestor_paper_id_idx` ON `lineage` (`ancestor_paper_id`);--> statement-breakpoint
CREATE TABLE `narratives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`full_narrative` text NOT NULL,
	`summary` text,
	`key_insights` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `narratives_concept_id_idx` ON `narratives` (`concept_id`);--> statement-breakpoint
CREATE TABLE `papers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`veritus_job_id` integer NOT NULL,
	`title` text NOT NULL,
	`authors` text,
	`abstract` text,
	`publication_date` text,
	`doi` text,
	`arxiv_id` text,
	`citations` integer,
	`source_url` text,
	`relevance_score` real,
	`created_at` text NOT NULL,
	FOREIGN KEY (`veritus_job_id`) REFERENCES `veritus_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `papers_veritus_job_id_idx` ON `papers` (`veritus_job_id`);--> statement-breakpoint
CREATE INDEX `papers_doi_idx` ON `papers` (`doi`);--> statement-breakpoint
CREATE INDEX `papers_arxiv_id_idx` ON `papers` (`arxiv_id`);--> statement-breakpoint
CREATE TABLE `veritus_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`job_id` text NOT NULL,
	`search_phrase` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `veritus_jobs_job_id_unique` ON `veritus_jobs` (`job_id`);--> statement-breakpoint
CREATE INDEX `veritus_jobs_concept_id_idx` ON `veritus_jobs` (`concept_id`);--> statement-breakpoint
CREATE INDEX `veritus_jobs_job_id_idx` ON `veritus_jobs` (`job_id`);--> statement-breakpoint
CREATE INDEX `veritus_jobs_status_idx` ON `veritus_jobs` (`status`);