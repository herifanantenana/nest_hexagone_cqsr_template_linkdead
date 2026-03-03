import { uuid } from "drizzle-orm/pg-core";

export const id = uuid("id").primaryKey().defaultRandom();
