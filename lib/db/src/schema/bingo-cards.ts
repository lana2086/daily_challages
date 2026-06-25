import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const bingoCardsTable = pgTable("bingo_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Daily Challenge Bingo"),
  rows: integer("rows").notNull().default(3),
  cols: integer("cols").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBingoCardSchema = createInsertSchema(bingoCardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBingoCard = z.infer<typeof insertBingoCardSchema>;
export type BingoCard = typeof bingoCardsTable.$inferSelect;
