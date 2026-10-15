ALTER TABLE `users` ADD `username` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(16);--> statement-breakpoint
-- Akun lama: username dari bagian depan email (huruf kecil, hanya a-z 0-9 _ .).
UPDATE `users` SET `username` = LEFT(REGEXP_REPLACE(LOWER(SUBSTRING_INDEX(`email`, '@', 1)), '[^a-z0-9_.]', ''), 20);--> statement-breakpoint
-- Wajib ada huruf (supaya tidak tertukar dengan nomor HP).
UPDATE `users` SET `username` = CONCAT('u', LEFT(`username`, 19)) WHERE `username` NOT REGEXP '[a-z]';--> statement-breakpoint
-- Kembar → tambah ".id" (maks 13 + 1 + 6 digit = 20 karakter).
UPDATE `users` u JOIN (SELECT `username` FROM `users` GROUP BY `username` HAVING COUNT(*) > 1) d ON d.`username` = u.`username` SET u.`username` = CONCAT(LEFT(u.`username`, 13), '.', u.`id`);--> statement-breakpoint
UPDATE `users` SET `username` = CONCAT(`username`, '.', `id`) WHERE CHAR_LENGTH(`username`) < 3;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone`);
