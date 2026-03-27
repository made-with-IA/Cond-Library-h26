import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/admins", authMiddleware, async (_req, res) => {
  const admins = await db
    .select({ id: adminsTable.id, name: adminsTable.name, email: adminsTable.email,
               createdAt: adminsTable.createdAt, updatedAt: adminsTable.updatedAt })
    .from(adminsTable)
    .orderBy(adminsTable.name);
  res.json({ admins });
});

router.post("/admins", authMiddleware, async (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }
  const existing = await db.query.adminsTable.findFirst({ where: eq(adminsTable.email, email.toLowerCase()) });
  if (existing) {
    res.status(409).json({ error: "An admin with this email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [admin] = await db
    .insert(adminsTable)
    .values({ name, email: email.toLowerCase(), passwordHash })
    .returning();
  res.status(201).json({ id: admin.id, name: admin.name, email: admin.email,
    createdAt: admin.createdAt, updatedAt: admin.updatedAt });
});

router.delete("/admins/:id", authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (req.admin!.id === id) {
    res.status(403).json({ error: "Cannot delete your own admin account" });
    return;
  }
  const deleted = await db.delete(adminsTable).where(eq(adminsTable.id, id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  res.json({ message: "Admin deleted" });
});

export default router;
