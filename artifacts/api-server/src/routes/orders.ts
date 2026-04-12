import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, ordersTable, usersTable, coinBalancesTable } from "@workspace/db";
import { PlaceOrderBody, GetMyOrdersResponse, PlaceOrderResponse } from "@workspace/api-zod";
import { getAuthUser } from "./auth";
import { getCurrentPrice } from "./crypto";

const router = Router();

async function getCoinBalance(userId: number, symbol: string, tx?: typeof db): Promise<number> {
  const client = tx ?? db;
  const [row] = await client
    .select()
    .from(coinBalancesTable)
    .where(and(eq(coinBalancesTable.userId, userId), eq(coinBalancesTable.symbol, symbol)));
  return row ? parseFloat(row.amount) : 0;
}

async function upsertCoinBalance(userId: number, symbol: string, delta: number, tx?: typeof db): Promise<void> {
  const client = tx ?? db;
  const current = await getCoinBalance(userId, symbol, tx);
  const newAmount = Math.max(0, current + delta);
  await client
    .insert(coinBalancesTable)
    .values({ userId, symbol, amount: newAmount.toString() })
    .onConflictDoUpdate({
      target: [coinBalancesTable.userId, coinBalancesTable.symbol],
      set: { amount: newAmount.toString() },
    });
}

router.post("/orders", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = PlaceOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { symbol, side, type, amount, price: limitPrice, total: inputTotal } = parsed.data;

  const quoteCurrency = "USDT";
  const baseCurrency = symbol.replace(/USDT$/, "");
  const currentPrice = getCurrentPrice(baseCurrency) ?? 1;

  try {
    if (type === "market") {
      if (side === "buy") {
        const spendUsdt = inputTotal ?? (amount * currentPrice);
        const receiveAmount = spendUsdt / currentPrice;

        const order = await db.transaction(async (tx) => {
          const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, auth.userId));
          if (!user) throw new Error("USER_NOT_FOUND");

          const usdtBalance = parseFloat(user.usdtBalance);
          if (usdtBalance < spendUsdt) throw new Error("INSUFFICIENT_USDT");

          await tx.update(usersTable)
            .set({ usdtBalance: (usdtBalance - spendUsdt).toFixed(8) })
            .where(eq(usersTable.id, auth.userId));

          await upsertCoinBalance(auth.userId, baseCurrency, receiveAmount, tx as any);

          const [o] = await tx.insert(ordersTable).values({
            userId: auth.userId,
            symbol,
            side: "buy",
            type: "market",
            amount: receiveAmount.toFixed(8),
            price: currentPrice.toFixed(8),
            status: "filled",
            filledAmount: receiveAmount.toFixed(8),
            avgPrice: currentPrice.toFixed(8),
            total: spendUsdt.toFixed(8),
          }).returning();
          return o;
        });

        res.status(201).json(PlaceOrderResponse.parse({
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          amount: parseFloat(order.amount),
          price: order.price ? parseFloat(order.price) : null,
          status: order.status,
          filledAmount: parseFloat(order.filledAmount),
          avgPrice: order.avgPrice ? parseFloat(order.avgPrice) : null,
          total: order.total ? parseFloat(order.total) : null,
          createdAt: order.createdAt.toISOString(),
        }));

      } else {
        const sellAmount = amount;

        const order = await db.transaction(async (tx) => {
          const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, auth.userId));
          if (!user) throw new Error("USER_NOT_FOUND");

          const coinBal = await getCoinBalance(auth.userId, baseCurrency, tx as any);
          if (coinBal < sellAmount) throw new Error(`INSUFFICIENT_${baseCurrency}`);

          const receiveUsdt = sellAmount * currentPrice;

          await upsertCoinBalance(auth.userId, baseCurrency, -sellAmount, tx as any);

          await tx.update(usersTable)
            .set({ usdtBalance: (parseFloat(user.usdtBalance) + receiveUsdt).toFixed(8) })
            .where(eq(usersTable.id, auth.userId));

          const [o] = await tx.insert(ordersTable).values({
            userId: auth.userId,
            symbol,
            side: "sell",
            type: "market",
            amount: sellAmount.toFixed(8),
            price: currentPrice.toFixed(8),
            status: "filled",
            filledAmount: sellAmount.toFixed(8),
            avgPrice: currentPrice.toFixed(8),
            total: receiveUsdt.toFixed(8),
          }).returning();
          return o;
        });

        res.status(201).json(PlaceOrderResponse.parse({
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          amount: parseFloat(order.amount),
          price: order.price ? parseFloat(order.price) : null,
          status: order.status,
          filledAmount: parseFloat(order.filledAmount),
          avgPrice: order.avgPrice ? parseFloat(order.avgPrice) : null,
          total: order.total ? parseFloat(order.total) : null,
          createdAt: order.createdAt.toISOString(),
        }));
      }
    } else {
      const orderPrice = limitPrice ?? currentPrice;

      const order = await db.transaction(async (tx) => {
        const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, auth.userId));
        if (!user) throw new Error("USER_NOT_FOUND");

        if (side === "buy") {
          const reserveUsdt = amount * orderPrice;
          const usdtBalance = parseFloat(user.usdtBalance);
          if (usdtBalance < reserveUsdt) throw new Error("INSUFFICIENT_USDT");
          await tx.update(usersTable)
            .set({ usdtBalance: (usdtBalance - reserveUsdt).toFixed(8) })
            .where(eq(usersTable.id, auth.userId));
        } else {
          const coinBal = await getCoinBalance(auth.userId, baseCurrency, tx as any);
          if (coinBal < amount) throw new Error(`INSUFFICIENT_${baseCurrency}`);
          await upsertCoinBalance(auth.userId, baseCurrency, -amount, tx as any);
        }

        const total = amount * orderPrice;
        const [o] = await tx.insert(ordersTable).values({
          userId: auth.userId,
          symbol,
          side,
          type: "limit",
          amount: amount.toFixed(8),
          price: orderPrice.toFixed(8),
          status: "open",
          filledAmount: "0",
          total: total.toFixed(8),
        }).returning();
        return o;
      });

      res.status(201).json(PlaceOrderResponse.parse({
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        amount: parseFloat(order.amount),
        price: order.price ? parseFloat(order.price) : null,
        status: order.status,
        filledAmount: parseFloat(order.filledAmount),
        avgPrice: order.avgPrice ? parseFloat(order.avgPrice) : null,
        total: order.total ? parseFloat(order.total) : null,
        createdAt: order.createdAt.toISOString(),
      }));
    }
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") {
      res.status(404).json({ error: "User not found" });
    } else if (err.message === "INSUFFICIENT_USDT") {
      res.status(400).json({ error: "Insufficient USDT balance" });
    } else if (err.message?.startsWith("INSUFFICIENT_")) {
      const coin = err.message.replace("INSUFFICIENT_", "");
      res.status(400).json({ error: `Insufficient ${coin} balance` });
    } else {
      throw err;
    }
  }
});

router.get("/orders", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, auth.userId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(100);

  const response = GetMyOrdersResponse.parse(orders.map(o => ({
    id: o.id,
    symbol: o.symbol,
    side: o.side,
    type: o.type,
    amount: parseFloat(o.amount),
    price: o.price ? parseFloat(o.price) : null,
    status: o.status,
    filledAmount: parseFloat(o.filledAmount),
    avgPrice: o.avgPrice ? parseFloat(o.avgPrice) : null,
    total: o.total ? parseFloat(o.total) : null,
    createdAt: o.createdAt.toISOString(),
  })));

  res.json(response);
});

router.delete("/orders/:id", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const orderId = parseInt(req.params.id);

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, auth.userId)));

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "open") throw new Error("ORDER_NOT_OPEN");

    const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, auth.userId));
    if (!user) throw new Error("USER_NOT_FOUND");

    const baseCurrency = order.symbol.replace(/USDT$/, "");
    const orderPrice = order.price ? parseFloat(order.price) : getCurrentPrice(baseCurrency) ?? 1;
    const orderAmount = parseFloat(order.amount);

    if (order.side === "buy") {
      const refundUsdt = orderAmount * orderPrice;
      await tx.update(usersTable)
        .set({ usdtBalance: (parseFloat(user.usdtBalance) + refundUsdt).toFixed(8) })
        .where(eq(usersTable.id, auth.userId));
    } else {
      await upsertCoinBalance(auth.userId, baseCurrency, orderAmount, tx as any);
    }

    await tx.update(ordersTable)
      .set({ status: "cancelled" })
      .where(eq(ordersTable.id, orderId));
  }).catch((err) => {
    if (err.message === "ORDER_NOT_FOUND") {
      res.status(404).json({ error: "Order not found" });
    } else if (err.message === "ORDER_NOT_OPEN") {
      res.status(400).json({ error: "Only open orders can be cancelled" });
    } else {
      throw err;
    }
    return;
  });

  if (!res.headersSent) {
    res.json({ success: true });
  }
});

router.get("/orders/balances", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const balances = await db
    .select()
    .from(coinBalancesTable)
    .where(eq(coinBalancesTable.userId, auth.userId));

  res.json(balances.map(b => ({ symbol: b.symbol, amount: parseFloat(b.amount) })));
});

export default router;
