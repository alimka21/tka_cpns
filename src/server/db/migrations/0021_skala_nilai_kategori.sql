-- Skala nilai, kategori capaian, & simulasi penuh (docs/PENSKORAN-DAN-PELAPORAN-TKA.md).
-- Hanya MENAMBAH tabel/kolom; idempoten (IF NOT EXISTS, MariaDB). Pengisian
-- nilai skala attempt lama TIDAK di sini — jalankan `npm run db:rescore`
-- (memakai rumus konversi TS yang sama & mencetak jumlah baris yang dihitung).
CREATE TABLE IF NOT EXISTS `achievement_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`score_scale` enum('0_100','200_800') NOT NULL,
	`category` enum('baik','memadai','kurang') NOT NULL,
	`min_score` decimal(6,2) NOT NULL,
	`max_score` decimal(6,2) NOT NULL,
	`is_official` boolean NOT NULL DEFAULT false,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `achievement_thresholds_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievement_thresholds_scale_category_idx` UNIQUE(`score_scale`,`category`),
	CONSTRAINT `achievement_thresholds_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE `attempts` ADD COLUMN IF NOT EXISTS `score_scale` enum('0_100','200_800');--> statement-breakpoint
ALTER TABLE `attempts` ADD COLUMN IF NOT EXISTS `scaled_score` decimal(6,2);--> statement-breakpoint
ALTER TABLE `attempts` ADD COLUMN IF NOT EXISTS `scoring_config_version` varchar(64);--> statement-breakpoint
ALTER TABLE `test_packages` ADD COLUMN IF NOT EXISTS `is_full_simulation` boolean DEFAULT false NOT NULL;
