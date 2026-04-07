import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  GetMyTransactionsResponse,
  GetMyBalanceResponse,
} from "@workspace/api-zod";
import { getAuthUser } from "./auth";
import { usersTable } from "@workspace/db";

const router = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, auth.userId))
    .orderBy(transactionsTable.createdAt);

  const response = GetMyTransactionsResponse.parse(
    transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount),
      currency: t.currency,
      status: t.status,
      address: t.address,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    }))
  );
  res.json(response);
});

router.post("/transactions", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, amount, currency, address, note } = parsed.data;

  const [transaction] = await db.insert(transactionsTable).values({
    userId: auth.userId,
    type,
    amount: amount.toString(),
    currency,
    address: address ?? undefined,
    note: note ?? undefined,
    status: "pending",
  }).returning();

  res.status(201).json({
    id: transaction.id,
    type: transaction.type,
    amount: parseFloat(transaction.amount),
    currency: transaction.currency,
    status: transaction.status,
    address: transaction.address,
    note: transaction.note,
    createdAt: transaction.createdAt.toISOString(),
  });
});

router.get("/users/balance", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const response = GetMyBalanceResponse.parse({
    usdt: parseFloat(user.usdtBalance),
    btc: parseFloat(user.btcBalance),
    eth: parseFloat(user.ethBalance),
  });
  res.json(response);
});

export default router;
