CREATE TABLE `app_settings` (
	`key` varchar(64) NOT NULL,
	`value` json NOT NULL,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `jenjang` enum('SD','SMP','SMA');--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','pending','rejected') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD CONSTRAINT `app_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;