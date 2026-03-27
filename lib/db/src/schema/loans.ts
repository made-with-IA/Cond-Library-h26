import { pgEnum, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { booksTable } from "./books";
import { usersTable } from "./users";

export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "returned",
  "overdue",
]);

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .notNull()
    .references(() => booksTable.id),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  status: loanStatusEnum("status").notNull().default("active"),
  loanDate: timestamp("loan_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
