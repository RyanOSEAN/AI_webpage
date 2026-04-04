CREATE TABLE `aiDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`className` varchar(255) NOT NULL,
	`confidence` varchar(10) NOT NULL,
	`xMin` int NOT NULL,
	`yMin` int NOT NULL,
	`xMax` int NOT NULL,
	`yMax` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiDetections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`beachName` varchar(255) NOT NULL,
	`latitude` varchar(50) NOT NULL,
	`longitude` varchar(50) NOT NULL,
	`collectionAmount` int NOT NULL,
	`beforeImageUrl` text NOT NULL,
	`beforeImageKey` text NOT NULL,
	`afterImageUrl` text NOT NULL,
	`afterImageKey` text NOT NULL,
	`isCollected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
