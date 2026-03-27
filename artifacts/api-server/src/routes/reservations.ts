import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable, booksTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router: IRouter = Router();

function buildReservationWithJoins(r: any, book: any, user: any) {
  return {
    ...r,
    book: book ? { id: book.id, title: book.title, author: book.author, genre: book.genre,
      isbn: book.isbn, publishedYear: book.publishedYear, imageUrl: book.imageUrl, status: book.status } : null,
    user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone,
      block: user.block, house: user.house, status: user.status,
      createdAt: user.createdAt, updatedAt: user.updatedAt } : null,
  };
}

router.get("/reservations", authMiddleware, async (req, res) => {
  const { bookId, userId, status } = req.query as Record<string, string>;
  const conditions = [];
  if (bookId) conditions.push(eq(reservationsTable.bookId, parseInt(bookId)));
  if (userId) conditions.push(eq(reservationsTable.userId, parseInt(userId)));
  if (status) conditions.push(eq(reservationsTable.status, status as any));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({ r: reservationsTable, book: booksTable, user: usersTable })
    .from(reservationsTable)
    .leftJoin(booksTable, eq(reservationsTable.bookId, booksTable.id))
    .leftJoin(usersTable, eq(reservationsTable.userId, usersTable.id))
    .where(where)
    .orderBy(reservationsTable.bookId, reservationsTable.position);

  res.json({ reservations: rows.map(({ r, book, user }) => buildReservationWithJoins(r, book, user)) });
});

router.post("/reservations", authMiddleware, async (req, res) => {
  const { bookId, userId } = req.body as { bookId?: number; userId?: number };
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
    res.status(400).json({ error: "Only active readers can join the reservation queue" });
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
    res.status(400).json({ error: "Reader already in queue for this book" });
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
  res.status(201).json(buildReservationWithJoins(reservation, freshBook, user));
});

router.patch("/reservations/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { action } = req.body as { action?: string };

  const result = await db
    .select({ r: reservationsTable, book: booksTable, user: usersTable })
    .from(reservationsTable)
    .leftJoin(booksTable, eq(reservationsTable.bookId, booksTable.id))
    .leftJoin(usersTable, eq(reservationsTable.userId, usersTable.id))
    .where(eq(reservationsTable.id, id))
    .limit(1);

  if (result.length === 0) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const { r: reservation, book, user } = result[0];

  if (action === "notify") {
    if (reservation.status !== "waiting") {
      res.status(400).json({ error: "Can only notify a waiting reservation" });
      return;
    }
    const firstWaiting = await db.query.reservationsTable.findFirst({
      where: and(eq(reservationsTable.bookId, reservation.bookId), eq(reservationsTable.status, "waiting")),
      orderBy: reservationsTable.position,
    });
    if (firstWaiting?.id !== id) {
      res.status(400).json({ error: "Can only notify the first person in the queue" });
      return;
    }
    const notifiedAt = new Date();
    const expiresAt = new Date(notifiedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    const [updated] = await db
      .update(reservationsTable)
      .set({ status: "notified", notifiedAt, expiresAt, updatedAt: new Date() })
      .where(eq(reservationsTable.id, id))
      .returning();
    await db.update(booksTable).set({ status: "reserved", updatedAt: new Date() }).where(eq(booksTable.id, reservation.bookId));
    const freshBook = await db.query.booksTable.findFirst({ where: eq(booksTable.id, reservation.bookId) });
    res.json(buildReservationWithJoins(updated, freshBook, user));

  } else if (action === "cancel") {
    const [updated] = await db
      .update(reservationsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(reservationsTable.id, id))
      .returning();
    await normalizePositions(reservation.bookId, reservation.position);
    const remaining = await db.query.reservationsTable.findFirst({
      where: and(eq(reservationsTable.bookId, reservation.bookId), eq(reservationsTable.status, "waiting")),
    });
    const notifiedRemaining = await db.query.reservationsTable.findFirst({
      where: and(eq(reservationsTable.bookId, reservation.bookId), eq(reservationsTable.status, "notified")),
    });
    if (!remaining && !notifiedRemaining && book?.status === "reserved") {
      await db.update(booksTable).set({ status: "available", updatedAt: new Date() }).where(eq(booksTable.id, reservation.bookId));
    }
    const freshBook = await db.query.booksTable.findFirst({ where: eq(booksTable.id, reservation.bookId) });
    res.json(buildReservationWithJoins(updated, freshBook, user));

  } else if (action === "fulfill") {
    const [updated] = await db
      .update(reservationsTable)
      .set({ status: "fulfilled", updatedAt: new Date() })
      .where(eq(reservationsTable.id, id))
      .returning();
    await normalizePositions(reservation.bookId, reservation.position);
    const next = await db.query.reservationsTable.findFirst({
      where: and(eq(reservationsTable.bookId, reservation.bookId), eq(reservationsTable.status, "waiting")),
      orderBy: reservationsTable.position,
    });
    if (next) {
      const notifiedAt = new Date();
      const expiresAt = new Date(notifiedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      await db.update(reservationsTable).set({ status: "notified", notifiedAt, expiresAt, updatedAt: new Date() })
        .where(eq(reservationsTable.id, next.id));
    } else {
      await db.update(booksTable).set({ status: "available", updatedAt: new Date() }).where(eq(booksTable.id, reservation.bookId));
    }
    const freshBook = await db.query.booksTable.findFirst({ where: eq(booksTable.id, reservation.bookId) });
    res.json(buildReservationWithJoins(updated, freshBook, user));

  } else if (action === "advance") {
    if (reservation.status !== "notified") {
      res.status(400).json({ error: "Can only advance (skip) a notified reservation" });
      return;
    }
    const [updated] = await db
      .update(reservationsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(reservationsTable.id, id))
      .returning();
    await normalizePositions(reservation.bookId, reservation.position);
    const next = await db.query.reservationsTable.findFirst({
      where: and(eq(reservationsTable.bookId, reservation.bookId), eq(reservationsTable.status, "waiting")),
      orderBy: reservationsTable.position,
    });
    if (next) {
      const notifiedAt = new Date();
      const expiresAt = new Date(notifiedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      await db.update(reservationsTable).set({ status: "notified", notifiedAt, expiresAt, updatedAt: new Date() })
        .where(eq(reservationsTable.id, next.id));
    } else {
      await db.update(booksTable).set({ status: "available", updatedAt: new Date() }).where(eq(booksTable.id, reservation.bookId));
    }
    const freshBook = await db.query.booksTable.findFirst({ where: eq(booksTable.id, reservation.bookId) });
    res.json(buildReservationWithJoins(updated, freshBook, user));

  } else {
    res.status(400).json({ error: "Invalid action. Use: notify, cancel, fulfill, advance" });
  }
});

router.delete("/reservations/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const reservation = await db.query.reservationsTable.findFirst({ where: eq(reservationsTable.id, id) });
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  await db.delete(reservationsTable).where(eq(reservationsTable.id, id));
  await normalizePositions(reservation.bookId, reservation.position);
  res.json({ message: "Reservation deleted" });
});

router.patch("/reservations/:id/notify", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [updated] = await db
    .update(reservationsTable)
    .set({ notifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(reservationsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  const [book, user] = await Promise.all([
    db.query.booksTable.findFirst({ where: eq(booksTable.id, updated.bookId) }),
    db.query.usersTable.findFirst({ where: eq(usersTable.id, updated.userId) }),
  ]);
  res.json(buildReservationWithJoins(updated, book, user));
});

async function normalizePositions(bookId: number, removedPosition: number) {
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

export default router;
