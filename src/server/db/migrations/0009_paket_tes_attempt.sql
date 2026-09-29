CREATE TABLE `attempt_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attempt_id` int NOT NULL,
	`question_id` int NOT NULL,
	`response` json,
	`is_flagged` boolean NOT NULL DEFAULT false,
	`answered_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attempt_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `attempt_answers_attempt_question_idx` UNIQUE(`attempt_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `attempt_subtopic_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attempt_id` int NOT NULL,
	`subtopic_id` int NOT NULL,
	`correct_count` int NOT NULL,
	`total_count` int NOT NULL,
	`score` int NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	CONSTRAINT `attempt_subtopic_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `attempt_subtopic_scores_attempt_subtopic_idx` UNIQUE(`attempt_id`,`subtopic_id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`test_package_id` int NOT NULL,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`ends_at` timestamp NOT NULL,
	`submitted_at` timestamp,
	`status` enum('in_progress','submitted','expired') NOT NULL DEFAULT 'in_progress',
	`total_score` int,
	`max_score` int,
	CONSTRAINT `attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`test_package_id` int NOT NULL,
	`granted_by` enum('admin_manual','purchase') NOT NULL DEFAULT 'admin_manual',
	`granted_by_user_id` int,
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `entitlements_user_pkg_idx` UNIQUE(`user_id`,`test_package_id`)
);
--> statement-breakpoint
CREATE TABLE `test_package_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_package_id` int NOT NULL,
	`question_id` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`points_override` int,
	CONSTRAINT `test_package_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `test_package_questions_pkg_question_idx` UNIQUE(`test_package_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `test_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category_id` int NOT NULL,
	`duration_minutes` int NOT NULL,
	`is_premium` boolean NOT NULL DEFAULT false,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `test_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_attempt_id_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempt_subtopic_scores` ADD CONSTRAINT `attempt_subtopic_scores_attempt_id_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempt_subtopic_scores` ADD CONSTRAINT `attempt_subtopic_scores_subtopic_id_subtopics_id_fk` FOREIGN KEY (`subtopic_id`) REFERENCES `subtopics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_test_package_id_test_packages_id_fk` FOREIGN KEY (`test_package_id`) REFERENCES `test_packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_test_package_id_test_packages_id_fk` FOREIGN KEY (`test_package_id`) REFERENCES `test_packages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_granted_by_user_id_users_id_fk` FOREIGN KEY (`granted_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_package_questions` ADD CONSTRAINT `test_package_questions_test_package_id_test_packages_id_fk` FOREIGN KEY (`test_package_id`) REFERENCES `test_packages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_package_questions` ADD CONSTRAINT `test_package_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_packages` ADD CONSTRAINT `test_packages_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_packages` ADD CONSTRAINT `test_packages_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;