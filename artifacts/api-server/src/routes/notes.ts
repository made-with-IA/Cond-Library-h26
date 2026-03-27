import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { libraryNotesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/notes", async (req, res) => {
  const { all } = req.query as { all?: string };
  const where = all === "true" ? undefined : eq(libraryNotesTable.active, true);
  const notes = await db.select().from(libraryNotesTable).where(where).orderBy(desc(libraryNotesTable.createdAt));
  res.json({ notes });
});

router.post("/notes", authMiddleware, async (req, res) => {
  const { title, content, type, active } = req.body as any;
  if (!title || !content) {
    res.status(400).json({ error: "Title and content are required" });
    return;
  }
  const [note] = await db
    .insert(libraryNotesTable)
    .values({ title, content, type: type ?? "info", active: active ?? true })
    .returning();
  res.status(201).json(note);
});

router.patch("/notes/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { title, content, type, active } = req.body as any;
  const [updated] = await db
    .update(libraryNotesTable)
    .set({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(active !== undefined && { active }),
      updatedAt: new Date(),
    })
    .where(eq(libraryNotesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(updated);
});

router.delete("/notes/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const deleted = await db.delete(libraryNotesTable).where(eq(libraryNotesTable.id, id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ message: "Note deleted" });
});

export default router;
