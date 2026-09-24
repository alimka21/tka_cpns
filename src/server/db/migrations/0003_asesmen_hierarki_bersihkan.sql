ALTER TABLE `topics` DROP FOREIGN KEY `topics_category_id_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `subtopics` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `topics` DROP COLUMN `category_id`;--> statement-breakpoint
ALTER TABLE `topics` DROP COLUMN `slug`;