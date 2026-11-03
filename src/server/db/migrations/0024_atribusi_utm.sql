-- Atribusi kampanye (UTM): satu baris per user, diisi saat daftar dari cookie pk_attr.
-- Hanya menambah tabel (aman dijalankan).

CREATE TABLE `user_attribution` (
	`user_id` int NOT NULL,
	`first_source` varchar(64),
	`first_medium` varchar(64),
	`first_campaign` varchar(64),
	`first_content` varchar(64),
	`first_term` varchar(64),
	`first_landing_path` varchar(255),
	`first_seen_at` timestamp,
	`last_source` varchar(64),
	`last_medium` varchar(64),
	`last_campaign` varchar(64),
	`last_content` varchar(64),
	`last_term` varchar(64),
	`last_landing_path` varchar(255),
	`last_seen_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_attribution_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `user_attribution` ADD CONSTRAINT `user_attribution_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_attribution_first_campaign_idx` ON `user_attribution` (`first_campaign`);--> statement-breakpoint
CREATE INDEX `user_attribution_last_campaign_idx` ON `user_attribution` (`last_campaign`);--> statement-breakpoint
CREATE INDEX `user_attribution_first_landing_idx` ON `user_attribution` (`first_landing_path`);