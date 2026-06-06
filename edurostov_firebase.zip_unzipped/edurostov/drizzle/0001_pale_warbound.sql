CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`institutionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(512),
	`message` text NOT NULL,
	`type` enum('feedback','cooperation','add_institution','other') DEFAULT 'feedback',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institution_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`type` enum('brochure','certificate','accreditation','other') NOT NULL DEFAULT 'other',
	`url` text NOT NULL,
	`fileKey` text NOT NULL,
	`name` varchar(256) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `institution_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institution_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` text NOT NULL,
	`caption` text,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `institution_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institution_specializations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`cost` enum('free','paid','mixed') DEFAULT 'paid',
	`description` text,
	CONSTRAINT `institution_specializations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`type` enum('university','college','institute','academy','school','other') NOT NULL DEFAULT 'college',
	`city` varchar(128) NOT NULL,
	`region` varchar(128) DEFAULT 'Ростовская область',
	`shortDescription` text,
	`description` text,
	`address` text,
	`phone` varchar(64),
	`email` varchar(320),
	`website` text,
	`socialVk` text,
	`socialTelegram` text,
	`socialInstagram` text,
	`logoKey` text,
	`logoUrl` text,
	`coverImageKey` text,
	`coverImageUrl` text,
	`directorName` varchar(256),
	`foundedYear` int,
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`status` enum('draft','pending','published','rejected') NOT NULL DEFAULT 'draft',
	`viewCount` int NOT NULL DEFAULT 0,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`featuredOrder` int DEFAULT 0,
	`promotionBadge` varchar(64),
	`createdBy` int,
	`representativeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `institutions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`content` text,
	`excerpt` text,
	`coverImageUrl` text,
	`coverImageKey` text,
	`authorId` int,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publication_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`editorId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publication_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`text` text,
	`representativeReply` text,
	`replyAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(16) NOT NULL,
	`pageViews` int NOT NULL DEFAULT 0,
	`registrations` int NOT NULL DEFAULT 0,
	`activeUsers` int NOT NULL DEFAULT 0,
	CONSTRAINT `site_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_stats_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredTypes` json,
	`preferredCities` json,
	`preferredSpecializations` json,
	`budget` enum('free','paid','any') DEFAULT 'any',
	`additionalInfo` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','editor','representative','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `customId` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isBlocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_customId_unique` UNIQUE(`customId`);