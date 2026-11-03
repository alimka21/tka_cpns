-- Lead magnet /materi/[slug]: file materi di DB (MEDIUMBLOB, maks 10 MB) + catatan unduhan.
-- Hanya menambah tabel (aman dijalankan).

CREATE TABLE `lead_magnet_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_magnet_id` int NOT NULL,
	`user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_magnet_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_magnets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`preview_text` text,
	`preview_image` mediumblob,
	`preview_image_mime` varchar(32),
	`file_data` mediumblob NOT NULL,
	`file_name` varchar(200) NOT NULL,
	`file_mime` varchar(64) NOT NULL,
	`file_size` int NOT NULL,
	`requires_login` boolean NOT NULL DEFAULT true,
	`is_active` boolean NOT NULL DEFAULT true,
	`cta_package_id` int,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_magnets_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_magnets_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `lead_magnet_downloads` ADD CONSTRAINT `lead_magnet_downloads_lead_magnet_id_lead_magnets_id_fk` FOREIGN KEY (`lead_magnet_id`) REFERENCES `lead_magnets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_magnet_downloads` ADD CONSTRAINT `lead_magnet_downloads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_magnets` ADD CONSTRAINT `lead_magnets_cta_package_id_test_packages_id_fk` FOREIGN KEY (`cta_package_id`) REFERENCES `test_packages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_magnets` ADD CONSTRAINT `lead_magnets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_magnet_downloads_magnet_idx` ON `lead_magnet_downloads` (`lead_magnet_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `lead_magnet_downloads_user_idx` ON `lead_magnet_downloads` (`user_id`);