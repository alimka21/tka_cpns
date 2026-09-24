ALTER TABLE `question_options` MODIFY COLUMN `is_correct` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `questions` MODIFY COLUMN `type` enum('single_choice') NOT NULL DEFAULT 'single_choice';--> statement-breakpoint
ALTER TABLE `question_options` DROP COLUMN `score_weight`;