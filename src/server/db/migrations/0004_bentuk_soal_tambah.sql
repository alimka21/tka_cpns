CREATE TABLE `stimuli` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`image_url` varchar(2048),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stimuli_id` PRIMARY KEY(`id`),
	CONSTRAINT `stimuli_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `questions` MODIFY COLUMN `type` enum('single_choice','pg','pgk_mcma','pgk_kategori') NOT NULL DEFAULT 'pg';--> statement-breakpoint
ALTER TABLE `question_options` ADD `correct_category` varchar(32);--> statement-breakpoint
ALTER TABLE `questions` ADD `category_labels` json;--> statement-breakpoint
ALTER TABLE `questions` ADD `stimulus_id` int;--> statement-breakpoint
ALTER TABLE `questions` ADD `stimulus_order` int;--> statement-breakpoint
ALTER TABLE `stimuli` ADD CONSTRAINT `stimuli_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_stimulus_id_stimuli_id_fk` FOREIGN KEY (`stimulus_id`) REFERENCES `stimuli`(`id`) ON DELETE no action ON UPDATE no action;