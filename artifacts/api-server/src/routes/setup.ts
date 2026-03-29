import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, adminsTable } from "@workspace/db";
import { count } from "drizzle-orm";

const router = Router();

router.post("/setup/first-admin", async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email e password são obrigatórios" });
    return;
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(adminsTable);

  if (Number(total) > 0) {
    res.status(403).json({ error: "Setup já realizado. Este endpoint está desabilitado." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [admin] = await db
    .insert(adminsTable)
    .values({ name, email, passwordHash })
    .returning({ id: adminsTable.id, name: adminsTable.name, email: adminsTable.email });

  res.status(201).json({ ok: true, admin });
});

export default router;
