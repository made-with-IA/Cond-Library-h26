import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, loansTable, booksTable } from "@workspace/db";
import { eq, or, ilike, and, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

type UserStatus = "pending" | "active" | "inactive" | "blocked";

interface CreateUserBody {
  name?: string;
  email?: string;
  phone?: string | null;
  block?: string | null;
  house?: string | null;
  status?: UserStatus;
  password?: string | null;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  phone?: string | null;
  block?: string | null;
  house?: string | null;
  status?: UserStatus;
  password?: string | null;
}

const router: IRouter = Router();

router.get("/users", authMiddleware, async (req, res) => {
  const { search, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(usersTable.name, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
      )!,
    );
  }
  if (status) conditions.push(eq(usersTable.status, status as UserStatus));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, countResult] = await Promise.all([
    db
      .select({
        id: usersTable.id, name: usersTable.name, email: usersTable.email,
        phone: usersTable.phone, block: usersTable.block, house: usersTable.house,
        status: usersTable.status, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(where)
      .orderBy(usersTable.name)
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  res.json({
    users,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.post("/users", authMiddleware, async (req, res) => {
  const { name, email, phone, block, house, status, password } = req.body as CreateUserBody;
  if (!name || !email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase()),
  });
  if (existing) {
    res.status(409).json({ error: "A reader with this email already exists" });
    return;
  }
  let passwordHash: string | null = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }
  const [user] = await db
    .insert(usersTable)
    .values({ name, email: email.toLowerCase(), phone, block, house, status: status ?? "pending", passwordHash })
    .returning();
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

router.get("/users/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
  if (!user) {
    res.status(404).json({ error: "Reader not found" });
    return;
  }
  const loans = await db
    .select({
      id: loansTable.id, bookId: loansTable.bookId, userId: loansTable.userId,
      status: loansTable.status, loanDate: loansTable.loanDate, dueDate: loansTable.dueDate,
      returnDate: loansTable.returnDate, createdAt: loansTable.createdAt,
      book: {
        id: booksTable.id, title: booksTable.title, author: booksTable.author,
        genre: booksTable.genre, isbn: booksTable.isbn, publishedYear: booksTable.publishedYear,
        imageUrl: booksTable.imageUrl, status: booksTable.status,
      },
    })
    .from(loansTable)
    .leftJoin(booksTable, eq(loansTable.bookId, booksTable.id))
    .where(eq(loansTable.userId, id))
    .orderBy(desc(loansTable.loanDate));

  const { passwordHash, ...safeUser } = user;
  res.json({ ...safeUser, loans });
});

router.patch("/users/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
  if (!existing) {
    res.status(404).json({ error: "Reader not found" });
    return;
  }
  const { name, email, phone, block, house, status, password } = req.body as UpdateUserBody;

  type UserUpdateFields = {
    name?: string;
    email?: string;
    phone?: string | null;
    block?: string | null;
    house?: string | null;
    status?: UserStatus;
    passwordHash?: string;
    updatedAt: Date;
  };

  const updates: UserUpdateFields = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email.toLowerCase();
  if (phone !== undefined) updates.phone = phone;
  if (block !== undefined) updates.block = block;
  if (house !== undefined) updates.house = house;
  if (status !== undefined) updates.status = status;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();
  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

router.delete("/users/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const deleted = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Reader not found" });
    return;
  }
  res.json({ message: "Reader deleted successfully" });
});

export default router;
