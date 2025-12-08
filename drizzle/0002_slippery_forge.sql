CREATE TABLE `payment_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`dodo_event_id` text,
	`event_data` text NOT NULL,
	`processed_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_dodo_event_id_unique` ON `payment_events` (`dodo_event_id`);--> statement-breakpoint
CREATE INDEX `payment_events_user_id_idx` ON `payment_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_events_event_type_idx` ON `payment_events` (`event_type`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`dodo_customer_id` text,
	`dodo_subscription_id` text,
	`plan_type` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_start` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_dodo_subscription_id_unique` ON `subscriptions` (`dodo_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_id_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`month` text NOT NULL,
	`concept_traces_used` integer DEFAULT 0 NOT NULL,
	`concept_traces_limit` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `usage_tracking_user_id_idx` ON `usage_tracking` (`user_id`);--> statement-breakpoint
CREATE INDEX `usage_tracking_month_idx` ON `usage_tracking` (`month`);--> statement-breakpoint
CREATE INDEX `usage_tracking_user_month_idx` ON `usage_tracking` (`user_id`,`month`);