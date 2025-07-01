CREATE TABLE `bookings` (
	`id` varchar(255) NOT NULL,
	`room_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`purpose` varchar(255),
	`status` enum('confirmed','pending','cancelled') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`capacity` int NOT NULL,
	`description` varchar(512),
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rooms_name_unique` UNIQUE(`name`)
);
