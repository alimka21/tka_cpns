-- Program referal: kode referal & pemberi referal di users, komisi per order lunas,
-- catatan transfer admin, rekening tujuan. Hanya menambah tabel/kolom (aman dijalankan).

CREATE TABLE `referral_accounts` (
	`user_id` int NOT NULL,
	`bank_name` varchar(60) NOT NULL,
	`account_number` varchar(40) NOT NULL,
	`account_name` varchar(100) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_accounts_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `referral_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_user_id` int NOT NULL,
	`referred_user_id` int NOT NULL,
	`order_id` int NOT NULL,
	`order_amount` int NOT NULL,
	`percent` int NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','paid','void') NOT NULL DEFAULT 'pending',
	`payout_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`paid_at` timestamp,
	CONSTRAINT `referral_commissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_commissions_order_idx` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `referral_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_user_id` int NOT NULL,
	`amount` int NOT NULL,
	`destination` varchar(200),
	`note` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `referral_code` varchar(12);--> statement-breakpoint
ALTER TABLE `users` ADD `referred_by_user_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referral_code_unique` UNIQUE(`referral_code`);--> statement-breakpoint
ALTER TABLE `referral_accounts` ADD CONSTRAINT `referral_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_commissions` ADD CONSTRAINT `referral_commissions_referrer_user_id_users_id_fk` FOREIGN KEY (`referrer_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_commissions` ADD CONSTRAINT `referral_commissions_referred_user_id_users_id_fk` FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_commissions` ADD CONSTRAINT `referral_commissions_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_payouts` ADD CONSTRAINT `referral_payouts_referrer_user_id_users_id_fk` FOREIGN KEY (`referrer_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_payouts` ADD CONSTRAINT `referral_payouts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `referral_commissions_referrer_idx` ON `referral_commissions` (`referrer_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `referral_payouts_referrer_idx` ON `referral_payouts` (`referrer_user_id`);--> statement-breakpoint
CREATE INDEX `users_referred_by_idx` ON `users` (`referred_by_user_id`);