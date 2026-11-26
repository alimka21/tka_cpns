CREATE TABLE `class_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`test_package_id` int NOT NULL,
	`note` text,
	`starts_at` timestamp NOT NULL,
	`due_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`user_id` int NOT NULL,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_members_class_user_idx` UNIQUE(`class_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacher_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`jenjang` enum('SD','SMP','SMA') NOT NULL,
	`join_code` varchar(8) NOT NULL,
	`archived_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_join_code_idx` UNIQUE(`join_code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `is_teacher` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `class_assignments` ADD CONSTRAINT `class_assignments_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_assignments` ADD CONSTRAINT `class_assignments_test_package_id_test_packages_id_fk` FOREIGN KEY (`test_package_id`) REFERENCES `test_packages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_members` ADD CONSTRAINT `class_members_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_members` ADD CONSTRAINT `class_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_teacher_id_users_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `class_assignments_class_starts_idx` ON `class_assignments` (`class_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `class_members_user_idx` ON `class_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `classes_teacher_idx` ON `classes` (`teacher_id`);