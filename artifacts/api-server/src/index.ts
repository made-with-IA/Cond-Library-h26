import app from "./app";
import { logger } from "./lib/logger";
import { db, adminsTable } from "@workspace/db";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function maybeCreateInitialAdmin() {
  const initEmail = process.env["INIT_ADMIN_EMAIL"];
  const initPassword = process.env["INIT_ADMIN_PASSWORD"];
  const initName = process.env["INIT_ADMIN_NAME"] ?? "Admin";

  if (!initEmail || !initPassword) return;

  const [{ total }] = await db.select({ total: count() }).from(adminsTable);
  if (Number(total) > 0) return;

  const passwordHash = await bcrypt.hash(initPassword, 10);
  await db.insert(adminsTable).values({ name: initName, email: initEmail, passwordHash });
  logger.info({ email: initEmail }, "Initial admin created from environment variables");
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await maybeCreateInitialAdmin();
});
