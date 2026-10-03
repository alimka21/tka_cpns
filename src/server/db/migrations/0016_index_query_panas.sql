CREATE INDEX `ai_logs_user_purpose_created_idx` ON `ai_generation_logs` (`user_id`,`purpose`,`created_at`);--> statement-breakpoint
CREATE INDEX `attempts_user_pkg_status_idx` ON `attempts` (`user_id`,`test_package_id`,`status`);--> statement-breakpoint
CREATE INDEX `attempts_user_started_idx` ON `attempts` (`user_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `attempts_status_submitted_idx` ON `attempts` (`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `questions_subtopic_status_idx` ON `questions` (`subtopic_id`,`status`);--> statement-breakpoint
CREATE INDEX `questions_created_at_idx` ON `questions` (`created_at`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);--> statement-breakpoint
CREATE INDEX `practice_questions_owner_subtopic_idx` ON `practice_questions` (`owner_user_id`,`subtopic_id`);--> statement-breakpoint
CREATE INDEX `practice_sessions_user_started_idx` ON `practice_sessions` (`user_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `question_reports_status_created_idx` ON `question_reports` (`status`,`created_at`);