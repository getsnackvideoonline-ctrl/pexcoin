import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, usersTable, transactionsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminGetUsersResponse,
  AdminGetUserResponse,
  AdminGetUserParams,
  AdminUpdateUserParams,
  AdminUpdateUserBody,
  AdminUpdateUserResponse,
  AdminGetTransactionsResponse,
  AdminApproveTransactionParams,
  AdminApproveTransactionResponse,
  AdminRejectTransactionParams,
  AdminRejectTransactionResponse,
  AdminGetStatsResponse,
} from "@workspace/api-zod";
import { getAuthUser } from "./auth";
import crypto from "crypto";

const router = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const COMMISSION_RATE = 0.05; // 5% commission to referrer

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "pexcoin_salt").digest("hex");
}

function generateAdminToken(): string {
  const payload = { role: "admin", exp: Date.now() + 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function isAdmin(req: { headers: { authorization?: string } }): boolean {
  const auth = getAuthUser(req);
  return auth?.role === "admin" || auth?.role === "super_admin";
}

function verifyAdminToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    return payload.role === "admin" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function checkAdminAuth(req: any, res: any): boolean {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (verifyAdminToken(token)) return true;
    if (isAdmin(req)) return true;
  }
  res.status(401).json({ error: "Unauthorized" });
  return false;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateAdminToken();
    const response = AdminLoginResponse.parse({ token, role: "admin" });
    res.json(response);
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, username));
  if (user && (user.role === "admin" || user.role === "super_admin") && user.password === hashPassword(password)) {
    const token = generateAdminToken();
    const response = AdminLoginResponse.parse({ token, role: "admin" });
    res.json(response);
    return;
  }

  res.status(401).json({ error: "Invalid credentials" });
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    usdtBalance: parseFloat(user.usdtBalance),
    btcBalance: parseFloat(user.btcBalance),
    ethBalance: parseFloat(user.ethBalance),
    inviteCode: user.inviteCode,
    referredBy: user.referredBy,
    commissionEarned: parseFloat(user.commissionEarned),
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/admin/users", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const response = AdminGetUsersResponse.parse(users.map(formatUser));
  res.json(response);
});

router.get("/admin/users/:id", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const params = AdminGetUserParams.safeParse({ id: parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const response = AdminGetUserResponse.parse(formatUser(user));
  res.json(response);
});

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const params = AdminUpdateUserParams.safeParse({ id: parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, string | undefined> = {};
  const body = parsed.data;
  if (body.status != null) updates.status = body.status;
  if (body.role != null) updates.role = body.role;
  if (body.usdtBalance != null) updates.usdtBalance = body.usdtBalance.toString();
  if (body.btcBalance != null) updates.btcBalance = body.btcBalance.toString();
  if (body.ethBalance != null) updates.ethBalance = body.ethBalance.toString();

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const response = AdminUpdateUserResponse.parse(formatUser(user));
  res.json(response);
});

function formatTransaction(t: typeof transactionsTable.$inferSelect, userEmail: string) {
  return {
    id: t.id,
    userId: t.userId,
    userEmail,
    type: t.type,
    amount: parseFloat(t.amount),
    currency: t.currency,
    status: t.status,
    address: t.address,
    note: t.note,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/admin/transactions", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const transactions = await db
    .select({ transaction: transactionsTable, userEmail: usersTable.email })
    .from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .orderBy(transactionsTable.createdAt);

  const response = AdminGetTransactionsResponse.parse(
    transactions.map(({ transaction: t, userEmail }) =>
      formatTransaction(t, userEmail ?? "unknown")
    )
  );
  res.json(response);
});

router.post("/admin/transactions/:id/approve", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const params = AdminApproveTransactionParams.safeParse({
    id: parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db
    .update(transactionsTable)
    .set({ status: "completed" })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  // Credit user balance on deposit
  if (transaction.type === "deposit") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, transaction.userId));
    if (user) {
      const amount = parseFloat(transaction.amount);
      const currency = transaction.currency.toUpperCase();
      const userUpdates: Record<string, string> = {};
      if (currency === "USDT") userUpdates.usdtBalance = (parseFloat(user.usdtBalance) + amount).toString();
      else if (currency === "BTC") userUpdates.btcBalance = (parseFloat(user.btcBalance) + amount).toString();
      else if (currency === "ETH") userUpdates.ethBalance = (parseFloat(user.ethBalance) + amount).toString();

      if (Object.keys(userUpdates).length > 0) {
        await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, user.id));
      }

      // Pay 5% commission to referrer if they have one
      if (user.referredBy) {
        const commission = amount * COMMISSION_RATE;
        const [referrer] = await db.select().from(usersTable).where(eq(usersTable.id, user.referredBy));
        if (referrer) {
          const referrerUpdates: Record<string, string> = {
            commissionEarned: (parseFloat(referrer.commissionEarned) + commission).toString(),
          };
          // Add commission to referrer's same currency balance
          if (currency === "USDT") referrerUpdates.usdtBalance = (parseFloat(referrer.usdtBalance) + commission).toString();
          else if (currency === "BTC") referrerUpdates.btcBalance = (parseFloat(referrer.btcBalance) + commission).toString();
          else if (currency === "ETH") referrerUpdates.ethBalance = (parseFloat(referrer.ethBalance) + commission).toString();

          await db.update(usersTable).set(referrerUpdates).where(eq(usersTable.id, referrer.id));
        }
      }
    }
  }

  const [joined] = await db
    .select({ transaction: transactionsTable, userEmail: usersTable.email })
    .from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(eq(transactionsTable.id, params.data.id));

  const response = AdminApproveTransactionResponse.parse(
    formatTransaction(joined.transaction, joined.userEmail ?? "unknown")
  );
  res.json(response);
});

router.post("/admin/transactions/:id/reject", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const params = AdminRejectTransactionParams.safeParse({
    id: parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db
    .update(transactionsTable)
    .set({ status: "rejected" })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const [joined] = await db
    .select({ transaction: transactionsTable, userEmail: usersTable.email })
    .from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(eq(transactionsTable.id, params.data.id));

  const response = AdminRejectTransactionResponse.parse(
    formatTransaction(joined.transaction, joined.userEmail ?? "unknown")
  );
  res.json(response);
});

router.get("/admin/invite-tree", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const allUsers = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      inviteCode: usersTable.inviteCode,
      referredBy: usersTable.referredBy,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.id);

  res.json(allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!checkAdminAuth(req, res)) return;

  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [pendingCount] = await db.select({ count: count() }).from(transactionsTable).where(eq(transactionsTable.status, "pending"));
  const [depositSum] = await db.select({ sum: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.type, "deposit"));
  const [withdrawalSum] = await db.select({ sum: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.type, "withdrawal"));
  const [activeUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.status, "active"));

  const response = AdminGetStatsResponse.parse({
    totalUsers: Number(userCount.count),
    totalDeposits: parseFloat(depositSum.sum ?? "0"),
    totalWithdrawals: parseFloat(withdrawalSum.sum ?? "0"),
    pendingTransactions: Number(pendingCount.count),
    activeUsers: Number(activeUsers.count),
  });
  res.json(response);
});

export default router;
