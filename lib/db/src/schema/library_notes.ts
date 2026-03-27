import { boolean, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const noteTypeEnum = pgEnum("note_type", [
  "rule",
  "info",
  "announcement",
]);

export const libraryNotesTable = pgTable("library_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: noteTypeEnum("type").notNull().default("info"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLibraryNoteSchema = createInsertSchema(libraryNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLibraryNote = z.infer<typeof insertLibraryNoteSchema>;
export type LibraryNote = typeof libraryNotesTable.$inferSelect;
