CREATE TYPE "evidences_types" AS ENUM('images', 'videos', 'documents', 'other');--> statement-breakpoint
CREATE TABLE "evidences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"exploit_id" uuid NOT NULL,
	"type" "evidences_types" NOT NULL,
	"filename" varchar(255) NOT NULL,
	"storage_path" varchar(1024) NOT NULL,
	"size_in_bytes" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exploits_categories" (
	"exploit_id" uuid,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exploits_categories_pk" PRIMARY KEY("exploit_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "exploits_skills" (
	"exploit_id" uuid,
	"skill_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exploits_skills_pk" PRIMARY KEY("exploit_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "avatar_url_path" TO "avatar_storage_path";--> statement-breakpoint
ALTER TABLE "exploits" RENAME COLUMN "user_id" TO "author_user_id";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "log_url_path" TO "logo_storage_path";--> statement-breakpoint
ALTER TABLE "exploits" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "exploits" ADD COLUMN "metadata" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "exploits" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exploits" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exploits" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exploits" ALTER COLUMN "title" SET DATA TYPE varchar(127) USING "title"::varchar(127);--> statement-breakpoint
ALTER TABLE "exploits" ALTER COLUMN "description" SET DATA TYPE text USING "description"::text;--> statement-breakpoint
ALTER TABLE "exploits" ALTER COLUMN "content_lexical" SET DATA TYPE jsonb USING "content_lexical"::jsonb;--> statement-breakpoint
ALTER TABLE "exploits" ADD CONSTRAINT "exploits_slug_key" UNIQUE("slug");--> statement-breakpoint
CREATE INDEX "evidences_exploit_id_idx" ON "evidences" ("exploit_id");--> statement-breakpoint
CREATE INDEX "exploits_categories_exploit_id_idx" ON "exploits_categories" ("exploit_id");--> statement-breakpoint
CREATE INDEX "exploits_categories_category_id_idx" ON "exploits_categories" ("category_id");--> statement-breakpoint
CREATE INDEX "exploits_skills_exploit_id_idx" ON "exploits_skills" ("exploit_id");--> statement-breakpoint
CREATE INDEX "exploits_skills_skill_id_idx" ON "exploits_skills" ("skill_id");--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_exploit_id_fk" FOREIGN KEY ("exploit_id") REFERENCES "exploits"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "exploits" ADD CONSTRAINT "exploits_author_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "exploits_categories" ADD CONSTRAINT "exploits_categories_exploit_id_fk" FOREIGN KEY ("exploit_id") REFERENCES "exploits"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "exploits_categories" ADD CONSTRAINT "exploits_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "exploits_skills" ADD CONSTRAINT "exploits_skills_exploit_id_fk" FOREIGN KEY ("exploit_id") REFERENCES "exploits"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "exploits_skills" ADD CONSTRAINT "exploits_skills_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;