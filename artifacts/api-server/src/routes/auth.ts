import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "pexcoin_default_secret_please_set_JWT_SECRET";

function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT ?? "pexcoin_salt";
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

function generateToken(userId: number, role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string): { userId: number; role: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export function getAuthUser(req: { headers: { authorization?: string } }): { userId: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

function formatUserForResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    inviteCode: user.inviteCode,
    referredBy: user.referredBy,
    commissionEarned: parseFloat(user.commissionEarned),
  };
}

router.get("/auth/invite/validate", async (req, res): Promise<void> => {
  const code = (req.query.code as string)?.toUpperCase();
  if (!code) {
    res.status(400).json({ valid: false, error: "Code is required" });
    return;
  }

  const [referrer] = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.inviteCode, code));

  if (!referrer) {
    res.status(404).json({ valid: false, error: "Invalid invitation code" });
    return;
  }

  res.json({ valid: true, referrerName: referrer.name });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues?.[0]?.message ?? "Invalid request";
    res.status(400).json({ error: firstError });
    return;
  }

  const { email, password, name, phone, inviteCode } = parsed.data;

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    res.status(400).json({ error: "Only Gmail addresses (@gmail.com) are accepted for registration" });
    return;
  }

  const [referrer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.inviteCode, inviteCode.toUpperCase()));

  if (!referrer) {
    res.status(400).json({ error: "Invalid invitation code. Please get a valid invite link from an existing member." });
    return;
  }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "This email is already registered" });
    return;
  }

  let newInviteCode: string;
  let codeExists = true;
  do {
    newInviteCode = generateInviteCode();
    const [check] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.inviteCode, newInviteCode));
    codeExists = !!check;
  } while (codeExists);

  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    password: hashPassword(password),
    name,
    phone: phone ?? undefined,
    inviteCode: newInviteCode,
    referredBy: referrer.id,
  }).returning();

  const token = generateToken(user.id, user.role);
  const response = LoginResponse.parse({
    user: formatUserForResponse(user),
    token,
  });
  res.status(201).json(response);
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

  if (!user || user.password !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken(user.id, user.role);
  const response = LoginResponse.parse({
    user: formatUserForResponse(user),
    token,
  });
  res.json(response);
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const response = GetMeResponse.parse(formatUserForResponse(user));
  res.json(response);
});

router.get("/auth/referrals", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const referrals = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.referredBy, auth.userId));

  res.json(referrals.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export { verifyToken };
export default router;
