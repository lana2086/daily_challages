import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export interface PassportPageData {
  missionName: string;
  round1: string;
  round2: string;
  reflection: string;
  uprooting: string;
}

export const passportsTable = pgTable("passports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  pages: jsonb("pages").$type<PassportPageData[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Passport = typeof passportsTable.$inferSelect;
