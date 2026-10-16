-- Data pendaftaran: provinsi asal & nama sekolah (wajib di form daftar; NULL = akun lama).
-- Hanya menambah kolom; idempoten (IF NOT EXISTS, MariaDB).
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `province` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `school_name` varchar(150);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `users_province_idx` ON `users` (`province`);
