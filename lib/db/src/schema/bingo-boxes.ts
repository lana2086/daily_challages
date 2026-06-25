import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bingoCardsTable } from "./bingo-cards";

export const bingoBoxesTable = pgTable("bingo_boxes", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => bingoCardsTable.id, { onDelete: "cascade" }),
  boxNumber: integer("box_number").notNull(),
  category: text("category", { enum: ["Spirit", "Mind", "Body", "Health", "People"] }).notNull(),
  challengeText: text("challenge_text").notNull(),
  isRevealed: boolean("is_revealed").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  revealedAt: timestamp("revealed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBingoBoxSchema = createInsertSchema(bingoBoxesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBingoBox = z.infer<typeof insertBingoBoxSchema>;
export type BingoBox = typeof bingoBoxesTable.$inferSelect;
