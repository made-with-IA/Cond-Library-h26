import bcrypt from "bcryptjs";
import { db, pool } from "@workspace/db";
import {
  adminsTable,
  usersTable,
  booksTable,
  loansTable,
  reservationsTable,
  libraryNotesTable,
} from "@workspace/db";

async function main() {
  console.log("🌱 Seeding database...");

  await db.delete(reservationsTable);
  await db.delete(loansTable);
  await db.delete(libraryNotesTable);
  await db.delete(booksTable);
  await db.delete(usersTable);
  await db.delete(adminsTable);

  console.log("✓ Cleared existing data");

  // ── Admin (1) ────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.insert(adminsTable).values([
    { name: "Library Admin", email: "admin@biblioteca.com", passwordHash: adminPassword },
  ]);
  console.log("✓ Created 1 admin");

  // ── Readers (10) ─────────────────────────────────────────────────────────

  const readerPassword = await bcrypt.hash("reader123", 10);
  const readers = await db
    .insert(usersTable)
    .values([
      { name: "Carlos Mendes",     email: "carlos@email.com",   phone: "+55 11 91234-0001", block: "A", house: "101", status: "active",   passwordHash: readerPassword },
      { name: "Ana Paula Silva",   email: "ana@email.com",      phone: "+55 11 91234-0002", block: "A", house: "202", status: "active",   passwordHash: readerPassword },
      { name: "João Rodrigues",    email: "joao@email.com",     phone: "+55 11 91234-0003", block: "B", house: "305", status: "active",   passwordHash: readerPassword },
      { name: "Fernanda Costa",    email: "fernanda@email.com", phone: "+55 11 91234-0004", block: "B", house: "104", status: "active",   passwordHash: readerPassword },
      { name: "Lucas Ferreira",    email: "lucas@email.com",    phone: "+55 11 91234-0005", block: "C", house: "201", status: "active",   passwordHash: readerPassword },
      { name: "Mariana Alves",     email: "mariana@email.com",  phone: "+55 11 91234-0006", block: "C", house: "302", status: "active",   passwordHash: readerPassword },
      { name: "Rafael Nascimento", email: "rafael@email.com",   phone: "+55 11 91234-0007", block: "D", house: "103", status: "active",   passwordHash: readerPassword },
      { name: "Juliana Carvalho",  email: "juliana@email.com",  phone: "+55 11 91234-0008", block: "D", house: "204", status: "pending",  passwordHash: null           },
      { name: "Pedro Santos",      email: "pedro@email.com",    phone: "+55 11 91234-0009", block: "A", house: "301", status: "active",   passwordHash: readerPassword },
      { name: "Camila Oliveira",   email: "camila@email.com",   phone: "+55 11 91234-0010", block: "B", house: "205", status: "inactive", passwordHash: null           },
    ])
    .returning();
  console.log(`✓ Created ${readers.length} readers`);

  // ── Books (20) ────────────────────────────────────────────────────────────

  const books = await db
    .insert(booksTable)
    .values([
      { title: "The Lord of the Rings",                     author: "J.R.R. Tolkien",          genre: "Fantasy",        isbn: "978-0-618-34399-7", publishedYear: 1954, description: "An epic fantasy novel about the quest to destroy the One Ring.",                                     status: "borrowed"   },
      { title: "1984",                                      author: "George Orwell",            genre: "Science Fiction",isbn: "978-0-451-52493-5", publishedYear: 1949, description: "A dystopian social science fiction novel about totalitarian government.",                            status: "borrowed"   },
      { title: "To Kill a Mockingbird",                     author: "Harper Lee",               genre: "Fiction",        isbn: "978-0-06-112008-4", publishedYear: 1960, description: "A novel about racial injustice and moral growth in the American South.",                            status: "borrowed"   },
      { title: "The Alchemist",                             author: "Paulo Coelho",             genre: "Fiction",        isbn: "978-0-06-231500-7", publishedYear: 1988, description: "A philosophical novel about a shepherd's journey to find treasure.",                               status: "borrowed"   },
      { title: "Harry Potter and the Philosopher's Stone",  author: "J.K. Rowling",            genre: "Fantasy",        isbn: "978-0-439-70818-8", publishedYear: 1997, description: "The first book in the Harry Potter series.",                                                       status: "borrowed"   },
      { title: "The Great Gatsby",                          author: "F. Scott Fitzgerald",      genre: "Fiction",        isbn: "978-0-7432-7356-5", publishedYear: 1925, description: "A novel about the American Dream in the Roaring Twenties.",                                        status: "borrowed"   },
      { title: "Brave New World",                           author: "Aldous Huxley",            genre: "Science Fiction",isbn: "978-0-06-085052-4", publishedYear: 1932, description: "A dystopian novel set in a futuristic World State.",                                               status: "borrowed"   },
      { title: "Pride and Prejudice",                       author: "Jane Austen",              genre: "Romance",        isbn: "978-0-14-143951-8", publishedYear: 1813, description: "A romantic novel of manners set in rural England.",                                                status: "borrowed"   },
      { title: "The Hitchhiker's Guide to the Galaxy",      author: "Douglas Adams",            genre: "Science Fiction",isbn: "978-0-345-39180-3", publishedYear: 1979, description: "A comedic science fiction series.",                                                               status: "borrowed"   },
      { title: "Sapiens: A Brief History of Humankind",     author: "Yuval Noah Harari",        genre: "History",        isbn: "978-0-06-231609-7", publishedYear: 2011, description: "A brief history of humankind from the Stone Age to the present.",                                 status: "borrowed"   },
      { title: "The Little Prince",                         author: "Antoine de Saint-Exupéry", genre: "Fiction",        isbn: "978-0-15-601219-5", publishedYear: 1943, description: "A poetic tale about a young prince who travels through space.",                                   status: "borrowed"   },
      { title: "Don Quixote",                               author: "Miguel de Cervantes",      genre: "Fiction",        isbn: "978-0-06-093434-2", publishedYear: 1605, description: "A novel about a man who believes himself to be a knight-errant.",                                 status: "available"  },
      { title: "Crime and Punishment",                      author: "Fyodor Dostoevsky",        genre: "Fiction",        isbn: "978-0-14-044913-6", publishedYear: 1866, description: "A novel about a student who commits murder and its psychological aftermath.",                      status: "available"  },
      { title: "The Catcher in the Rye",                    author: "J.D. Salinger",            genre: "Fiction",        isbn: "978-0-316-76948-0", publishedYear: 1951, description: "A novel about teenage alienation and loss of innocence.",                                         status: "available"  },
      { title: "Atomic Habits",                             author: "James Clear",              genre: "Self-Help",      isbn: "978-0-7352-1129-2", publishedYear: 2018, description: "An easy and proven way to build good habits and break bad ones.",                                  status: "reserved"   },
      { title: "Dune",                                      author: "Frank Herbert",            genre: "Science Fiction",isbn: "978-0-441-17271-9", publishedYear: 1965, description: "An epic science fiction novel set in a distant future.",                                           status: "available"  },
      { title: "The Name of the Wind",                      author: "Patrick Rothfuss",         genre: "Fantasy",        isbn: "978-0-7564-0407-9", publishedYear: 2007, description: "The tale of a legendary wizard told in his own words.",                                            status: "available"  },
      { title: "Educated",                                  author: "Tara Westover",            genre: "Biography",      isbn: "978-0-399-59050-4", publishedYear: 2018, description: "A memoir about a woman who grows up in the mountains of Idaho.",                                   status: "available"  },
      { title: "The Midnight Library",                      author: "Matt Haig",                genre: "Fiction",        isbn: "978-0-525-55947-4", publishedYear: 2020, description: "A novel about a library between life and death.",                                                 status: "available"  },
      { title: "Thinking, Fast and Slow",                   author: "Daniel Kahneman",          genre: "Self-Help",      isbn: "978-0-374-27563-1", publishedYear: 2011, description: "A summary of decades of research in cognitive science and behavioral economics.",                 status: "available"  },
    ])
    .returning();
  console.log(`✓ Created ${books.length} books`);

  // ── Loans ─────────────────────────────────────────────────────────────────
  // 8 active, 3 overdue, plus some returned history

  const daysAgo    = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

  const loans = await db
    .insert(loansTable)
    .values([
      // Active (books 0–7 are borrowed)
      { bookId: books[0].id,  userId: readers[0].id, status: "active",   loanDate: daysAgo(5),  dueDate: daysFromNow(10) },
      { bookId: books[1].id,  userId: readers[1].id, status: "active",   loanDate: daysAgo(3),  dueDate: daysFromNow(12) },
      { bookId: books[4].id,  userId: readers[2].id, status: "active",   loanDate: daysAgo(7),  dueDate: daysFromNow(8)  },
      { bookId: books[5].id,  userId: readers[3].id, status: "active",   loanDate: daysAgo(2),  dueDate: daysFromNow(13) },
      { bookId: books[6].id,  userId: readers[4].id, status: "active",   loanDate: daysAgo(10), dueDate: daysFromNow(5)  },
      { bookId: books[7].id,  userId: readers[5].id, status: "active",   loanDate: daysAgo(1),  dueDate: daysFromNow(14) },
      { bookId: books[10].id, userId: readers[6].id, status: "active",   loanDate: daysAgo(6),  dueDate: daysFromNow(9)  },
      { bookId: books[9].id,  userId: readers[8].id, status: "active",   loanDate: daysAgo(4),  dueDate: daysFromNow(11) },
      // Overdue
      { bookId: books[2].id,  userId: readers[0].id, status: "overdue",  loanDate: daysAgo(30), dueDate: daysAgo(15) },
      { bookId: books[3].id,  userId: readers[1].id, status: "overdue",  loanDate: daysAgo(25), dueDate: daysAgo(10) },
      { bookId: books[8].id,  userId: readers[2].id, status: "overdue",  loanDate: daysAgo(20), dueDate: daysAgo(5)  },
      // Returned (history)
      { bookId: books[11].id, userId: readers[3].id, status: "returned", loanDate: daysAgo(45), dueDate: daysAgo(30), returnDate: daysAgo(28) },
      { bookId: books[12].id, userId: readers[4].id, status: "returned", loanDate: daysAgo(60), dueDate: daysAgo(45), returnDate: daysAgo(42) },
      { bookId: books[13].id, userId: readers[5].id, status: "returned", loanDate: daysAgo(50), dueDate: daysAgo(35), returnDate: daysAgo(33) },
    ])
    .returning();
  console.log(`✓ Created ${loans.length} loans (8 active, 3 overdue, 3 returned)`);

  // ── Reservations ──────────────────────────────────────────────────────────

  const reservations = await db
    .insert(reservationsTable)
    .values([
      { bookId: books[14].id, userId: readers[2].id, position: 1, status: "notified", notifiedAt: daysAgo(1), expiresAt: daysFromNow(2) },
      { bookId: books[14].id, userId: readers[3].id, position: 2, status: "waiting" },
      { bookId: books[1].id,  userId: readers[4].id, position: 1, status: "waiting" },
      { bookId: books[4].id,  userId: readers[5].id, position: 1, status: "waiting" },
    ])
    .returning();
  console.log(`✓ Created ${reservations.length} reservations`);

  // ── Library Notes (3) ─────────────────────────────────────────────────────

  const notes = await db
    .insert(libraryNotesTable)
    .values([
      { title: "Library Hours",     content: "The library is open Monday to Friday from 8am to 8pm, and Saturdays from 9am to 5pm.",                                                          type: "info",         active: true  },
      { title: "Loan Rules",        content: "Each reader may borrow up to 3 books at a time for a period of 15 days. Renewals must be requested in person.",                                  type: "rule",         active: true  },
      { title: "New Books Arrived", content: "We received 20 new titles this month! Check the catalog for the latest additions including Atomic Habits, The Midnight Library, and Educated.", type: "announcement", active: true  },
    ])
    .returning();
  console.log(`✓ Created ${notes.length} library notes`);

  console.log("\n✅ Seed complete!");
  console.log("\n📧 Login credentials:");
  console.log("  Admin:  admin@biblioteca.com / admin123");
  console.log("  Reader: carlos@email.com / reader123");
}

main()
  .catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); })
  .finally(() => pool.end());
