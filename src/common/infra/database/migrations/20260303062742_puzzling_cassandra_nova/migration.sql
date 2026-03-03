CREATE TYPE "account_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "auth_providers" AS ENUM('local', 'google', 'github');--> statement-breakpoint
CREATE TYPE "actors_types" AS ENUM('user', 'organization');--> statement-breakpoint
CREATE TYPE "sessions_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "organization_status" AS ENUM('active', 'suspended', 'deactivated', 'banned');--> statement-breakpoint
CREATE TYPE "organization_types" AS ENUM('company', 'startup', 'association', 'community', 'freelance', 'school', 'other');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"provider" "auth_providers" NOT NULL,
	"provider_account_id" varchar(255),
	"hashed_password" varchar(255),
	"two_fa_enabled" boolean DEFAULT false NOT NULL,
	"two_fa_secret" varchar(255),
	"two_fa_confirmed_at" timestamp with time zone,
	"status" "account_status" DEFAULT 'active'::"account_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" "actors_types" NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "only_one_id" CHECK (((user_id IS NOT NULL AND organization_id IS NULL AND type = 'user') OR (user_id IS NULL AND organization_id IS NOT NULL AND type = 'organization')))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"hashed_refresh_token" varchar(255) NOT NULL,
	"user_agent" varchar(255),
	"ip_address" varchar(45),
	"device_id" varchar(255),
	"status" "sessions_status" DEFAULT 'active'::"sessions_status" NOT NULL,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"username" varchar(50),
	"email" varchar(255) NOT NULL UNIQUE,
	"bio" text,
	"avatar_url" varchar(255),
	"website_url" varchar(255),
	"location" varchar(100),
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"name" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"slug" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"type" "organization_types" DEFAULT 'company'::"organization_types" NOT NULL,
	"status" "organization_status" DEFAULT 'active'::"organization_status" NOT NULL,
	"log_url" varchar(255),
	"website_url" varchar(255),
	"location" varchar(100),
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "sessions_account_id_idx" ON "sessions" ("account_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_actor_id_idx" ON "sessions" ("actor_id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "actors"("id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");