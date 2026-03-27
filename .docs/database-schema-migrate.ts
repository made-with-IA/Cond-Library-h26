// src/db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "reader"]);

export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "active",
  "inactive",
  "blocked",
]);

export const bookStatusEnum = pgEnum("book_status", [
  "draft",
  "available",
  "reserved",
  "borrowed",
  "missing",
  "lost",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "returned",
  "overdue",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "waiting",
  "notified",
  "cancelled",
  "fulfilled",
  "expired",
]);

// Users
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 30 }),
    block: varchar("block", { length: 50 }),
    unit: varchar("unit", { length: 50 }),
    role: userRoleEnum("role").notNull().default("reader"),
    status: userStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
    statusIdx: index("users_status_idx").on(table.status),
  })
);

// Books
export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    author: varchar("author", { length: 200 }).notNull(),
    genre: varchar("genre", { length: 100 }),
    coverImage: text("cover_image"),
    description: text("description"),
    status: bookStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    titleIdx: index("books_title_idx").on(table.title),
    authorIdx: index("books_author_idx").on(table.author),
    statusIdx: index("books_status_idx").on(table.status),
  })
);

// Loans
export const loans = pgTable(
  "loans",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "restrict" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    loanDate: timestamp("loan_date", { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    returnDate: timestamp("return_date", { withTimezone: true }),
    status: loanStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookIdx: index("loans_book_id_idx").on(table.bookId),
    userIdx: index("loans_user_id_idx").on(table.userId),
    statusIdx: index("loans_status_idx").on(table.status),
    dueDateIdx: index("loans_due_date_idx").on(table.dueDate),
  })
);

// Reservations / waitlist
export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "restrict" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    status: reservationStatusEnum("status").notNull().default("waiting"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookIdx: index("reservations_book_id_idx").on(table.bookId),
    userIdx: index("reservations_user_id_idx").on(table.userId),
    statusIdx: index("reservations_status_idx").on(table.status),
    bookPositionUnique: uniqueIndex("reservations_book_position_unique").on(
      table.bookId,
      table.position
    ),
  })
);

// Optional admin notes
export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isPinned: boolean("is_pinned").notNull().default(false),
  },
  (table) => ({
    pinnedIdx: index("notes_is_pinned_idx").on(table.isPinned),
  })
);
