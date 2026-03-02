import { timestamp } from "drizzle-orm/pg-core";

export const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
export const deletedAt = timestamp("deleted_at", { withTimezone: true });
export const expiresAt = timestamp("expires_at", { withTimezone: true }).notNull();
export const revokedAt = timestamp("revoked_at", { withTimezone: true });
