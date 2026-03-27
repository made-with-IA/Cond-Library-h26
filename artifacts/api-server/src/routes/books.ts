import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { booksTable, loansTable, reservationsTable, usersTable } from "@workspace/db";
import { eq, like, sql, and, desc, or, ilike } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/books", async (req, res) => {
  const { search, status, genre, page = "1", limit = "12" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(booksTable.title, `%${search}%`),
        ilike(booksTable.author, `%${search}%`),
      )!,
    );
  }
  if (status) conditions.push(eq(booksTable.status, status as any));
  if (genre) conditions.push(ilike(booksTable.genre, `%${genre}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [books, countResult] = await Promise.all([
    db
      .select()
      .from(booksTable)
      .where(where)
      .orderBy(desc(booksTable.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(booksTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  res.json({
    books,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

router.post("/books", authMiddleware, async (req, res) => {
  const { title, author, genre, isbn, publishedYear, imageUrl, description, status } = req.body as any;
  if (!title || !author || !genre) {
    res.status(400).json({ error: "Title, author, and genre are required" });
    return;
  }
  const [book] = await db
    .insert(booksTable)
    .values({ title, author, genre, isbn, publishedYear, imageUrl, description, status: status ?? "available" })
    .returning();
  res.status(201).json({ ...book, loans: [], reservations: [] });
});

router.get("/books/:id", async (req, res) => {
  const id = parseInt(String(req.params.id));
  const book = await db.query.booksTable.findFirst({ where: eq(booksTable.id, id) });
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const loans = await db
    .select({
      id: loansTable.id, bookId: loansTable.bookId, userId: loansTable.userId,
      status: loansTable.status, loanDate: loansTable.loanDate, dueDate: loansTable.dueDate,
      returnDate: loansTable.returnDate, createdAt: loansTable.createdAt,
      user: { id: usersTable.id, name: usersTable.name, email: usersTable.email,
               phone: usersTable.phone, block: usersTable.block, house: usersTable.house,
               status: usersTable.status, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt },
    })
    .from(loansTable)
    .leftJoin(usersTable, eq(loansTable.userId, usersTable.id))
    .where(eq(loansTable.bookId, id))
    .orderBy(desc(loansTable.loanDate));

  const reservations = await db
    .select({
      id: reservationsTable.id, bookId: reservationsTable.bookId, userId: reservationsTable.userId,
      position: reservationsTable.position, status: reservationsTable.status,
      notifiedAt: reservationsTable.notifiedAt, expiresAt: reservationsTable.expiresAt,
      createdAt: reservationsTable.createdAt, updatedAt: reservationsTable.updatedAt,
      user: { id: usersTable.id, name: usersTable.name, email: usersTable.email,
               phone: usersTable.phone, block: usersTable.block, house: usersTable.house,
               status: usersTable.status, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt },
    })
    .from(reservationsTable)
    .leftJoin(usersTable, eq(reservationsTable.userId, usersTable.id))
    .where(eq(reservationsTable.bookId, id))
    .orderBy(reservationsTable.position);

  res.json({ ...book, loans, reservations });
});

router.patch("/books/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const existing = await db.query.booksTable.findFirst({ where: eq(booksTable.id, id) });
  if (!existing) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  const { title, author, genre, isbn, publishedYear, imageUrl, description, status } = req.body as any;
  const [updated] = await db
    .update(booksTable)
    .set({
      ...(title !== undefined && { title }),
      ...(author !== undefined && { author }),
      ...(genre !== undefined && { genre }),
      ...(isbn !== undefined && { isbn }),
      ...(publishedYear !== undefined && { publishedYear }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    })
    .where(eq(booksTable.id, id))
    .returning();
  res.json({ ...updated, loans: [], reservations: [] });
});

router.delete("/books/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const loanCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(loansTable)
    .where(eq(loansTable.bookId, id));
  if (Number(loanCount[0]?.count) > 0) {
    res.status(409).json({ error: "Cannot delete book with loan history. Set status to 'unavailable' instead." });
    return;
  }
  await db.delete(reservationsTable).where(eq(reservationsTable.bookId, id));
  const deleted = await db.delete(booksTable).where(eq(booksTable.id, id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json({ message: "Book deleted successfully" });
});

export default router;
