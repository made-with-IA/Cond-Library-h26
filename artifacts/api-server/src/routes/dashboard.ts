import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { booksTable, usersTable, loansTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res) => {
  const [
    totalBooksResult,
    availableResult,
    borrowedResult,
    activeReadersResult,
    activeLoansResult,
    overdueLoansResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(booksTable),
    db.select({ count: sql<number>`count(*)` }).from(booksTable).where(eq(booksTable.status, "available")),
    db.select({ count: sql<number>`count(*)` }).from(booksTable).where(eq(booksTable.status, "borrowed")),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(loansTable).where(eq(loansTable.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(loansTable).where(eq(loansTable.status, "overdue")),
  ]);

  const popularBooksRaw = await db
    .select({
      book: booksTable,
      loanCount: sql<number>`count(${loansTable.id})`,
    })
    .from(booksTable)
    .leftJoin(loansTable, eq(loansTable.bookId, booksTable.id))
    .groupBy(booksTable.id)
    .orderBy(desc(sql`count(${loansTable.id})`))
    .limit(5);

  const popularBooks = popularBooksRaw.map(({ book }) => ({
    id: book.id, title: book.title, author: book.author, genre: book.genre,
    isbn: book.isbn, publishedYear: book.publishedYear, imageUrl: book.imageUrl, status: book.status,
  }));

  res.json({
    totalBooks: Number(totalBooksResult[0]?.count ?? 0),
    availableBooks: Number(availableResult[0]?.count ?? 0),
    borrowedBooks: Number(borrowedResult[0]?.count ?? 0),
    activeReaders: Number(activeReadersResult[0]?.count ?? 0),
    activeLoans: Number(activeLoansResult[0]?.count ?? 0),
    overdueLoans: Number(overdueLoansResult[0]?.count ?? 0),
    popularBooks,
  });
});

export default router;
