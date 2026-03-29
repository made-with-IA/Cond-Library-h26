import bcrypt from "bcryptjs";
import { db, pool, adminsTable } from "@workspace/db";

async function main() {
  const hash = await bcrypt.hash("admin@leo", 10);
  await db.insert(adminsTable).values({
    name: "Leo Moraes",
    email: "leo@leohmoraes.pro",
    passwordHash: hash,
  });
  console.log("✅ Admin criado: leo@leohmoraes.pro");
  await pool.end();
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
