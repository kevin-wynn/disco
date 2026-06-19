CREATE TABLE `wishlist` (
	`id` integer PRIMARY KEY NOT NULL,
	`album_id` integer NOT NULL,
	`discogs_id` integer NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`year` text,
	`image_url` text,
	`format` text,
	`label` text,
	`country` text,
	`added_at` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);
