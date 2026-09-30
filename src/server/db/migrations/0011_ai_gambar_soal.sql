CREATE TABLE `ai_generation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`purpose` enum('bank_admin','practice') NOT NULL,
	`mode` enum('baru','variasi','gambar') NOT NULL,
	`subtopic_code` varchar(32) NOT NULL,
	`source_question_id` int,
	`image_id` int,
	`requested` int NOT NULL,
	`valid_count` int NOT NULL DEFAULT 0,
	`model` varchar(64) NOT NULL,
	`error` text,
	`duration_ms` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_generation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`mime` varchar(32) NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`size_bytes` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`data` mediumblob NOT NULL,
	`uploaded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `question_images_sha256_unique` UNIQUE(`sha256`)
);
--> statement-breakpoint
ALTER TABLE `user_ai_settings` DROP FOREIGN KEY `user_ai_settings_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `questions` ADD `source_question_id` int;--> statement-breakpoint
ALTER TABLE `user_ai_settings` ADD CONSTRAINT `user_ai_settings_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `ai_generation_logs` ADD CONSTRAINT `ai_generation_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_images` ADD CONSTRAINT `question_images_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_ai_settings` ADD CONSTRAINT `user_ai_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;