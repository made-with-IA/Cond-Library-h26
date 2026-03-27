import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { adminsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const _jwtRaw = process.env.JWT_SECRET;
if (!_jwtRaw) {
  throw new Error("JWT_SECRET environment variable is required but was not provided.");
}
const JWT_SECRET: string = _jwtRaw;

export interface AdminPayload {
  adminId: number;
  email: string;
  type: "admin";
}

export interface ReaderPayload {
  userId: number;
  email: string;
  type: "reader";
}

declare global {
  namespace Express {
    interface Request {
      admin?: typeof adminsTable.$inferSelect;
      reader?: typeof usersTable.$inferSelect;
    }
  }
}

export function signAdminToken(payload: Omit<AdminPayload, "type">): string {
  return jwt.sign({ ...payload, type: "admin" }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function signReaderToken(payload: Omit<ReaderPayload, "type">): string {
  return jwt.sign({ ...payload, type: "reader" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (payload.type !== "admin") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }
    const admin = await db.query.adminsTable.findFirst({
      where: eq(adminsTable.id, payload.adminId),
    });
    if (!admin) {
      res.status(401).json({ error: "Admin not found" });
      return;
    }
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function readerAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ReaderPayload;
    if (payload.type !== "reader") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, payload.userId),
    });
    if (!user) {
      res.status(401).json({ error: "Reader not found" });
      return;
    }
    req.reader = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
