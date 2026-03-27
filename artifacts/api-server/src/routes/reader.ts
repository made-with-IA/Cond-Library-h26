import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, loansTable, booksTable, reservationsTable } from "@workspace/db";
import { eq, and, lt, desc, sql } from "drizzle-orm";
import { readerAuthMiddleware, signReaderToken } from "../middlewares/auth.js";

const router: IRouter = Router();

async function autoMarkOverdue() {
  const now = new Date();
  await db
    .update(loansTable)
    .set({ status: "overdue" })
    .where(and(eq(loansTable.status, "active"), lt(loansTable.dueDate, now)));
}

function safeLoan(
  loan: typeof loansTable.$inferSelect,
  book: typeof booksTable.$inferSelect | null | undefined,
) {
  return {
    ...loan,
    book: book
      ? {
          id: book.id, title: book.title, author: book.author, genre: book.genre,
          isbn: book.isbn, publishedYear: book.publishedYear, imageUrl: book.imageUrl, status: book.status,
        }
      : null,
  };
}

function safeReservation(
  r: typeof reservationsTable.$inferSelect,
  book: typeof booksTable.$inferSelect | null | undefined,
) {
  return {
    ...r,
    book: book
      ? {
          id: book.id, title: book.title, author: book.author, genre: book.genre,
          isbn: book.isbn, publishedYear: book.publishedYear, imageUrl: book.imageUrl, status: book.status,
        }
      : null,
  };
}

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

router.post("/reader/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase()),
  });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password, or account has no password set" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signReaderToken({ userId: user.id, email: user.email });
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get("/reader/auth/me", readerAuthMiddleware, (req, res) => {
  const { passwordHash, ...safeUser } = req.reader as typeof usersTable.$inferSelect;
  res.json(safeUser);
});

router.get("/reader/dashboard", readerAuthMiddleware, async (req, res) => {
  const userId = req.reader!.id;
  await autoMarkOverdue();

  const [activeLoans, overdueLoans, pendingReservations, totalLoans] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(loansTable)
      .where(and(eq(loansTable.userId, userId), eq(loansTable.status, "active"))),
    db.select({ count: sql<number>`count(*)` }).from(loansTable)
      .where(and(eq(loansTable.userId, userId), eq(loansTable.status, "overdue"))),
    db.select({ count: sql<number>`count(*)` }).from(reservationsTable)
      .where(and(eq(reservationsTable.userId, userId), eq(reservationsTable.status, "waiting"))),
    db.select({ count: sql<number>`count(*)` }).from(loansTable)
      .where(eq(loansTable.userId, userId)),
  ]);

  res.json({
    activeLoans: Number(activeLoans[0]?.count ?? 0),
    overdueLoans: Number(overdueLoans[0]?.count ?? 0),
    pendingReservations: Number(pendingReservations[0]?.count ?? 0),
    totalLoans: Number(totalLoans[0]?.count ?? 0),
  });
});

router.get("/reader/loans", readerAuthMiddleware, async (req, res) => {
  const userId = req.reader!.id;
  await autoMarkOverdue();

  const allLoans = await db
    .select({ loan: loansTable, book: booksTable })
    .from(loansTable)
    .leftJoin(booksTable, eq(loansTable.bookId, booksTable.id))
    .where(eq(loansTable.userId, userId))
    .orderBy(desc(loansTable.loanDate));

  const active = allLoans
    .filter(({ loan }) => loan.status === "active" || loan.status === "overdue")
    .map(({ loan, book }) => safeLoan(loan, book));
  const history = allLoans
    .filter(({ loan }) => loan.status === "returned")
    .map(({ loan, book }) => safeLoan(loan, book));

  res.json({ active, history });
});

router.get("/reader/reservations", readerAuthMiddleware, async (req, res) => {
  const userId = req.reader!.id;

  const reservations = await db
    .select({ r: reservationsTable, book: booksTable })
    .from(reservationsTable)
    .leftJoin(booksTable, eq(reservationsTable.bookId, booksTable.id))
    .where(eq(reservationsTable.userId, userId))
    .orderBy(desc(reservationsTable.createdAt));

  res.json({
    reservations: reservations.map(({ r, book }) => safeReservation(r, book)),
  });
});

router.post("/reader/reservations", readerAuthMiddleware, async (req, res) => {
  const userId = req.reader!.id;
  const { bookId } = req.body as { bookId?: number };

  if (!bookId) {
    res.status(400).json({ error: "bookId is required" });
    return;
  }

  const book = await db.query.booksTable.findFirst({ where: eq(booksTable.id, bookId) });
  if (!book) {
    res.status(400).json({ error: "Book not found" });
    return;
  }

  const existing = await db.query.reservationsTable.findFirst({
    where: and(
      eq(reservationsTable.bookId, bookId),
      eq(reservationsTable.userId, userId),
      eq(reservationsTable.status, "waiting"),
    ),
  });
  if (existing) {
    res.status(400).json({ error: "You are already in the queue for this book" });
    return;
  }

  const maxPositionResult = await db
    .select({ max: sql<number>`coalesce(max(position), 0)` })
    .from(reservationsTable)
    .where(and(eq(reservationsTable.bookId, bookId), eq(reservationsTable.status, "waiting")));

  const nextPosition = Number(maxPositionResult[0]?.max ?? 0) + 1;

  let status: "waiting" | "notified" = "waiting";
  let notifiedAt: Date | undefined;
  let expiresAt: Date | undefined;

  if (book.status === "available") {
    status = "notified";
    notifiedAt = new Date();
    expiresAt = new Date(notifiedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    await db.update(booksTable).set({ status: "reserved", updatedAt: new Date() }).where(eq(booksTable.id, bookId));
  }

  const [reservation] = await db
    .insert(reservationsTable)
    .values({ bookId, userId, position: nextPosition, status, notifiedAt, expiresAt })
    .returning();

  const freshBook = await db.query.booksTable.findFirst({ where: eq(booksTable.id, bookId) });
  res.status(201).json(safeReservation(reservation, freshBook));
});

router.delete("/reader/reservations/:id", readerAuthMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const userId = req.reader!.id;

  const reservation = await db.query.reservationsTable.findFirst({
    where: eq(reservationsTable.id, id),
  });
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  if (reservation.userId !== userId) {
    res.status(403).json({ error: "Not allowed" });
    return;
  }
  if (reservation.status === "fulfilled") {
    res.status(400).json({ error: "Cannot cancel a fulfilled reservation" });
    return;
  }

  await db
    .update(reservationsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(reservationsTable.id, id));

  // Normalize FIFO positions for remaining waiting entries
  await normalizeQueuePositions(reservation.bookId, reservation.position);

  // If the cancelled reservation was notified, promote the next waiting reader
  if (reservation.status === "notified") {
    const next = await db.query.reservationsTable.findFirst({
      where: and(
        eq(reservationsTable.bookId, reservation.bookId),
        eq(reservationsTable.status, "waiting"),
      ),
      orderBy: reservationsTable.position,
    });

    if (next) {
      const notifiedAt = new Date();
      const expiresAt = new Date(notifiedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      await db
        .update(reservationsTable)
        .set({ status: "notified", notifiedAt, expiresAt, updatedAt: new Date() })
        .where(eq(reservationsTable.id, next.id));
      // Book stays reserved for the next person
    } else {
      // No more waiters — release the book
      await db
        .update(booksTable)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(booksTable.id, reservation.bookId));
    }
  } else {
    // Waiting reservation cancelled: check if queue is now fully empty
    const notifiedRemaining = await db.query.reservationsTable.findFirst({
      where: and(
        eq(reservationsTable.bookId, reservation.bookId),
        eq(reservationsTable.status, "notified"),
      ),
    });
    const waitingRemaining = await db.query.reservationsTable.findFirst({
      where: and(
        eq(reservationsTable.bookId, reservation.bookId),
        eq(reservationsTable.status, "waiting"),
      ),
    });
    if (!notifiedRemaining && !waitingRemaining) {
      await db
        .update(booksTable)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(booksTable.id, reservation.bookId));
    }
  }

  res.json({ message: "Reservation cancelled" });
});

router.patch("/reader/profile", readerAuthMiddleware, async (req, res) => {
  const userId = req.reader!.id;
  const { phone, password, currentPassword } = req.body as {
    phone?: string | null;
    password?: string | null;
    currentPassword?: string | null;
  };

  type UserUpdate = {
    phone?: string | null;
    passwordHash?: string;
    updatedAt: Date;
  };

  const updates: UserUpdate = { updatedAt: new Date() };

  if (phone !== undefined) updates.phone = phone;

  if (password) {
    if (currentPassword) {
      const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
      if (user?.passwordHash) {
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
          res.status(400).json({ error: "Current password is incorrect" });
          return;
        }
      }
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  const { passwordHash, ...safeUser } = updated;
  res.json(safeUser);
});

router.post("/reader/lookup", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase()),
  });
  if (!user) {
    res.status(404).json({ error: "No reader found with this email. Please check the email or contact the library admin." });
    return;
  }

  await autoMarkOverdue();

  const allLoans = await db
    .select({ loan: loansTable, book: booksTable })
    .from(loansTable)
    .leftJoin(booksTable, eq(loansTable.bookId, booksTable.id))
    .where(eq(loansTable.userId, user.id))
    .orderBy(desc(loansTable.loanDate));

  const activeLoans = allLoans
    .filter(({ loan }) => loan.status === "active")
    .map(({ loan, book }) => safeLoan(loan, book));
  const overdueLoans = allLoans
    .filter(({ loan }) => loan.status === "overdue")
    .map(({ loan, book }) => safeLoan(loan, book));

  const reservations = await db
    .select({ r: reservationsTable, book: booksTable })
    .from(reservationsTable)
    .leftJoin(booksTable, eq(reservationsTable.bookId, booksTable.id))
    .where(and(
      eq(reservationsTable.userId, user.id),
      eq(reservationsTable.status, "waiting"),
    ))
    .orderBy(reservationsTable.position);

  const { passwordHash, ...safeUser } = user;
  res.json({
    user: safeUser,
    activeLoans,
    overdueLoans,
    reservations: reservations.map(({ r, book }) => safeReservation(r, book)),
  });
});

export default router;
