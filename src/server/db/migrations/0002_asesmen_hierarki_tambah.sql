CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`type` enum('wajib','pilihan') NOT NULL,
	`structure` enum('kompetensi_subkompetensi','elemen_subelemen') NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `subtopics` MODIFY COLUMN `name` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `code` varchar(8) NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `cognitive_level` varchar(4);--> statement-breakpoint
ALTER TABLE `subtopics` ADD `code` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `subject_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `code` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `description` text;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `subtopics` ADD CONSTRAINT `subtopics_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `topics` ADD CONSTRAINT `topics_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `topics` ADD CONSTRAINT `topics_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;