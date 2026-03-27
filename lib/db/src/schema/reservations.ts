import { pgEnum, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { booksTable } from "./books";
import { usersTable } from "./users";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "waiting",
  "notified",
  "fulfilled",
  "cancelled",
]);

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .notNull()
    .references(() => booksTable.id),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  position: integer("position").notNull(),
  status: reservationStatusEnum("status").notNull().default("waiting"),
  notifiedAt: timestamp("notified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
