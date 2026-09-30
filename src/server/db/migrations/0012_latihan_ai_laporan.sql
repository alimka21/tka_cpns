CREATE TABLE `practice_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_user_id` int NOT NULL,
	`subtopic_id` int NOT NULL,
	`type` enum('pg','pgk_mcma','pgk_kategori') NOT NULL,
	`question_text` text NOT NULL,
	`category_labels` json,
	`options` json NOT NULL,
	`explanation` text NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`cognitive_level` varchar(4),
	`model` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`question_id` int,
	`practice_question_id` int,
	`reason` enum('kunci_salah','soal_ambigu','di_luar_materi','salah_ketik','lainnya') NOT NULL,
	`note` varchar(500),
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`resolved_by` int,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `question_reports_user_question_idx` UNIQUE(`user_id`,`question_id`),
	CONSTRAINT `question_reports_user_practice_idx` UNIQUE(`user_id`,`practice_question_id`)
);
--> statement-breakpoint
ALTER TABLE `ai_generation_logs` MODIFY COLUMN `mode` enum('baru','variasi','gambar','grup') NOT NULL;--> statement-breakpoint
ALTER TABLE `practice_session_items` MODIFY COLUMN `question_id` int;--> statement-breakpoint
ALTER TABLE `practice_session_items` ADD `practice_question_id` int;--> statement-breakpoint
ALTER TABLE `practice_questions` ADD CONSTRAINT `practice_questions_owner_user_id_users_id_fk` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_questions` ADD CONSTRAINT `practice_questions_subtopic_id_subtopics_id_fk` FOREIGN KEY (`subtopic_id`) REFERENCES `subtopics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_reports` ADD CONSTRAINT `question_reports_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_reports` ADD CONSTRAINT `question_reports_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_reports` ADD CONSTRAINT `question_reports_practice_question_id_practice_questions_id_fk` FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_reports` ADD CONSTRAINT `question_reports_resolved_by_users_id_fk` FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_session_items` ADD CONSTRAINT `psi_practice_question_fk` FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON DELETE cascade ON UPDATE no action;