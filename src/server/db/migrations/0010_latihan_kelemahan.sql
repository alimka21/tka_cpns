CREATE TABLE `practice_session_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`order` int NOT NULL,
	`question_id` int NOT NULL,
	`response` json,
	`is_correct` boolean,
	`answered_at` timestamp,
	CONSTRAINT `practice_session_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `practice_items_session_order_idx` UNIQUE(`session_id`,`order`),
	CONSTRAINT `practice_items_session_question_idx` UNIQUE(`session_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_subtopic_ids` json NOT NULL,
	`question_count` int NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`total_score` int,
	`max_score` int,
	CONSTRAINT `practice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `practice_session_items` ADD CONSTRAINT `practice_session_items_session_id_practice_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `practice_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_session_items` ADD CONSTRAINT `practice_session_items_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_sessions` ADD CONSTRAINT `practice_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;