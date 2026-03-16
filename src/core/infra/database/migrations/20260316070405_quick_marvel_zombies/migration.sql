CREATE TABLE "exploits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1024) NOT NULL,
	"content_lexical" json NOT NULL,
	"content_text" text NOT NULL,
	"domain_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "avatar_url_path";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "log_url" TO "log_url_path";