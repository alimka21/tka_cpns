CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`user_id` int,
	`name` varchar(100) NOT NULL,
	`school` varchar(150),
	`phone` varchar(20),
	`note` text,
	`status` enum('invited','active','suspended') NOT NULL DEFAULT 'invited',
	`commission_percent` int,
	`invited_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`activated_at` timestamp,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_email_idx` UNIQUE(`email`),
	CONSTRAINT `affiliates_user_idx` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `memberships` MODIFY COLUMN `granted_by` enum('purchase','admin_manual','affiliate') NOT NULL;--> statement-breakpoint
ALTER TABLE `referral_commissions` ADD `available_at` timestamp;--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;