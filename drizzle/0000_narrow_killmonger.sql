CREATE TABLE `albums` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`year` text,
	`genres` text,
	`styles` text,
	`discogs_id` integer,
	`image_url` text,
	`deleted_at` integer,
	`artist_id` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`deleted_at` integer,
	`discogs_id` integer,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`duration` text,
	`deleted_at` integer,
	`album_id` integer NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);
