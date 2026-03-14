CREATE TYPE "skills_types" AS ENUM('technical', 'hard', 'soft', 'other');--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_slug_key";--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "skill_type" "skills_types" DEFAULT 'hard'::"skills_types" NOT NULL;--> statement-breakpoint
ALTER TABLE "categories_skills" DROP COLUMN "id";--> statement-breakpoint
CREATE INDEX "categories_domain_id_idx" ON "categories" ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_domain_id_slug_uq" ON "categories" ("domain_id","slug");--> statement-breakpoint
CREATE INDEX "categories_skills_category_id_idx" ON "categories_skills" ("category_id");--> statement-breakpoint
CREATE INDEX "categories_skills_skill_id_idx" ON "categories_skills" ("skill_id");--> statement-breakpoint
CREATE INDEX "domains_skills_domain_id_idx" ON "domains_skills" ("domain_id");--> statement-breakpoint
CREATE INDEX "domains_skills_skill_id_idx" ON "domains_skills" ("skill_id");