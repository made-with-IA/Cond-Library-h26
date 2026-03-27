import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { loansTable, booksTable, usersTable, reservationsTable } from "@workspace/db";
import { eq, and, lt, lte, gte, desc, sql, or } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router: IRouter = Router();

async function autoMarkOverdue() {
  const now = new Date();
  await db
    .update(loansTable)
    .set({ status: "overdue" })
    .where(and(eq(loansTable.status, "active"), lt(loansTable.dueDate, now)));
}

function buildLoanWithJoins(
  loan: typeof loansTable.$inferSelect,
  book: typeof booksTable.$inferSelect | null | undefined,
  user: typeof usersTable.$inferSelect | null | undefined,
) {
  return {
    ...loan,
    book: book
      ? {
          id: book.id, title: book.title, author: book.author, genre: book.genre,
          isbn: book.isbn, publishedYear: book.publishedYear, imageUrl: book.imageUrl, status: book.status,
        }
      : null,
    user: user
      ? {
          id: user.id, name: user.name, email: user.email, phone: user.phone,
          block: user.block, house: user.house, status: user.status,
          createdAt: user.createdAt, updatedAt: user.updatedAt,
        }
      : null,
  };
}

type LoanStatus = "active" | "returned" | "overdue";
type ReportStatus = "upcoming" | "due_today" | "overdue" | "returned";

router.get("/loans", authMiddleware, async (req, res) => {
  const { status, userId, bookId, dueSoon, dueDateFrom, dueDateTo, reportStatus, page = "1", limit = "20" } =
    req.query as Record<string, string>;

  await autoMarkOverdue();

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;
  const now = new Date();

  const conditions = [];
  if (status) conditions.push(eq(loansTable.status, status as LoanStatus));
  if (userId) conditions.push(eq(loansTable.userId, parseInt(userId)));
  if (bookId) conditions.push(eq(loansTable.bookId, parseInt(bookId)));
  if (dueSoon === "true") {
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    conditions.push(
      and(
        eq(loansTable.status, "active"),
        gte(loansTable.dueDate, now),
        lte(loansTable.dueDate, threeDays),
      )!,
    );
  }
  if (dueDateFrom) conditions.push(gte(loansTable.dueDate, new Date(dueDateFrom)));
  if (dueDateTo) conditions.push(lte(loansTable.dueDate, new Date(dueDateTo)));
  if (reportStatus) {
    const rs = reportStatus as ReportStatus;
    if (rs === "upcoming") {
      conditions.push(
        and(or(eq(loansTable.status, "active"), eq(loansTable.status, "overdue"))!, gte(loansTable.dueDate, now))!,
      );
    } else if (rs === "due_today") {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      conditions.push(
        and(
          or(eq(loansTable.status, "active"), eq(loansTable.status, "overdue"))!,
          gte(loansTable.dueDate, startOfDay),
          lte(loansTable.dueDate, endOfDay),
        )!,
      );
    } else if (rs === "overdue") {
      conditions.push(eq(loansTable.status, "overdue"));
    } else if (rs === "returned") {
      conditions.push(eq(loansTable.status, "returned"));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [loansRaw, countResult] = await Promise.all([
    db
      .select({ loan: loansTable, book: booksTable, user: usersTable })
      .from(loansTable)
      .leftJoin(booksTable, eq(loansTable.bookId, booksTable.id))
      .leftJoin(usersTable, eq(loansTable.userId, usersTable.id))
      .where(where)
      .orderBy(desc(loansTable.loanDate))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(loansTable).where(where),
  ]);

  const loans = loansRaw.map(({ loan, book, user }) => buildLoanWithJoins(loan, book, user));
  const total = Number(countResult[0]?.count ?? 0);

  res.json({
    loans,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.post("/loans", authMiddleware, async (req, res) => {
  const { bookId, userId, dueDate } = req.body as {
    bookId?: number;
    userId?: number;
    dueDate?: string;
  };

  if (!bookId || !userId) {
    res.status(400).json({ error: "bookId and userId are required" });
    return;
  }

  const [book, user] = await Promise.all([
    db.query.booksTable.findFirst({ where: eq(booksTable.id, bookId) }),
    db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) }),
  ]);

  if (!book) { res.status(400).json({ error: "Book not found" }); return; }
  if (!user) { res.status(400).json({ error: "Reader not found" }); return; }
  if (user.status !== "active") {
    res.status(400).json({ error: `Reader status is '${user.status}'. Only active readers can borrow books.` });
    return;
  }
  if (book.status === "borrowed") {
    res.status(400).json({ error: "Book is currently borrowed" });
    return;
  }
  if (!["available", "reserved"].includes(book.status)) {
    res.status(400).json({ error: `Book status is '${book.status}'. Cannot create a loan.` });
    return;
  }

  if (book.status === "reserved") {
    const notifiedReservation = await db.query.reservationsTable.findFirst({
      where: and(
        eq(reservationsTable.bookId, bookId),
        eq(reservationsTable.status, "notified"),
      ),
    });
    if (notifiedReservation && notifiedReservation.userId !== userId) {
      const reservedUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, notifiedReservation.userId),
      });
      res.status(400).json({
        error: `This book is reserved for ${reservedUser?.name}. Only that reader can borrow this book now.`,
      });
      return;
    }
  }

  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 15);
  const finalDueDate = dueDate ? new Date(dueDate) : defaultDueDate;

  const [loan] = await db
    .insert(loansTable)
    .values({ bookId, userId, status: "active", loanDate: new Date(), dueDate: finalDueDate })
    .returning();

  await db.update(booksTable).set({ status: "borrowed", updatedAt: new Date() }).where(eq(booksTable.id, bookId));

  // Fulfill the notified reservation if this loan came from one
  if (book.status === "reserved") {
    const notifiedReservation = await db.query.reservationsTable.findFirst({
      where: and(
        eq(reservationsTable.bookId, bookId),
        eq(reservationsTable.status, "notified"),
        eq(reservationsTable.userId, userId),
      ),
    });
    if (notifiedReservation) {
      await db
        .update(reservationsTable)
        .set({ status: "fulfilled", updatedAt: new Date() })
        .where(eq(reservationsTable.id, notifiedReservation.id));
      await normalizeQueuePositions(bookId, notifiedReservation.position);
    }
  }

  res.status(201).json(buildLoanWithJoins(loan, book, user));
});

router.get("/loans/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const result = await db
    .select({ loan: loansTable, book: booksTable, user: usersTable })
    .from(loansTable)
    .leftJoin(booksTable, eq(loansTable.bookId, booksTable.id))
    .leftJoin(usersTable, eq(loansTable.userId, usersTable.id))
    .where(eq(loansTable.id, id))
    .limit(1);

  if (result.length === 0) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  const { loan, book, user } = result[0];
  res.json(buildLoanWithJoins(loan, book, user));
});

router.patch("/loans/:id/return", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const loan = await db.query.loansTable.findFirst({ where: eq(loansTable.id, id) });
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  if (loan.status === "returned") {
    res.status(400).json({ error: "Loan already returned" });
    return;
  }

  const [updated] = await db
    .update(loansTable)
    .set({ status: "returned", returnDate: new Date() })
    .where(eq(loansTable.id, id))
    .returning();

  const nextWaiting = await db.query.reservationsTable.findFirst({
    where: and(eq(reservationsTable.bookId, loan.bookId), eq(reservationsTable.status, "waiting")),
    orderBy: reservationsTable.position,
  });

  if (nextWaiting) {
    const notifiedAt = new Date();
    const expiresAt = new Date(notifiedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    await db
      .update(reservationsTable)
      .set({ status: "notified", notifiedAt, expiresAt, updatedAt: new Date() })
      .where(eq(reservationsTable.id, nextWaiting.id));
    await db
      .update(booksTable)
      .set({ status: "reserved", updatedAt: new Date() })
      .where(eq(booksTable.id, loan.bookId));
  } else {
    await db
      .update(booksTable)
      .set({ status: "available", updatedAt: new Date() })
      .where(eq(booksTable.id, loan.bookId));
  }

  const [freshBook, freshUser] = await Promise.all([
    db.query.booksTable.findFirst({ where: eq(booksTable.id, updated.bookId) }),
    db.query.usersTable.findFirst({ where: eq(usersTable.id, updated.userId) }),
  ]);

  res.json(buildLoanWithJoins(updated, freshBook, freshUser));
});

async function normalizeQueuePositions(bookId: number, removedPosition: number) {
  const remaining = await db
    .select()
    .from(reservationsTable)
    .where(and(eq(reservationsTable.bookId, bookId), eq(reservationsTable.status, "waiting")))
    .orderBy(reservationsTable.position);

  for (const r of remaining) {
    if (r.position > removedPosition) {
      await db
        .update(reservationsTable)
        .set({ position: r.position - 1, updatedAt: new Date() })
        .where(eq(reservationsTable.id, r.id));
    }
  }
}

export { normalizeQueuePositions };
export default router;
