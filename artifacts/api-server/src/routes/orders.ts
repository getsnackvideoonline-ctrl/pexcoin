import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, ordersTable, usersTable, coinBalancesTable } from "@workspace/db";
import { PlaceOrderBody, GetMyOrdersResponse, PlaceOrderResponse } from "@workspace/api-zod";
import { getAuthUser } from "./auth";
import { getCurrentPrice } from "./crypto";

const router = Router();

async function getCoinBalance(userId: number, symbol: string): Promise<number> {
  const [row] = await db
    .select()
    .from(coinBalancesTable)
    .where(and(eq(coinBalancesTable.userId, userId), eq(coinBalancesTable.symbol, symbol)));
  return row ? parseFloat(row.amount) : 0;
}

async function upsertCoinBalance(userId: number, symbol: string, delta: number): Promise<void> {
  const current = await getCoinBalance(userId, symbol);
  const newAmount = Math.max(0, current + delta);
  await db
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

  // Extract base and quote (e.g., BTCUSDT => BTC, USDT)
  const quoteCurrency = "USDT";
  const baseCurrency = symbol.replace(/USDT$/, "");

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const usdtBalance = parseFloat(user.usdtBalance);
  const currentPrice = getCurrentPrice(baseCurrency) ?? 1;

  if (type === "market") {
    if (side === "buy") {
      // For market buy: spend USDT, receive base coin
      const spendUsdt = inputTotal ?? (amount * currentPrice);
      const receiveAmount = spendUsdt / currentPrice;

      if (usdtBalance < spendUsdt) {
        res.status(400).json({ error: "Insufficient USDT balance" });
        return;
      }

      // Deduct USDT
      await db.update(usersTable)
        .set({ usdtBalance: (usdtBalance - spendUsdt).toFixed(8) })
        .where(eq(usersTable.id, auth.userId));

      // Credit coin
      await upsertCoinBalance(auth.userId, baseCurrency, receiveAmount);

      // Record order
      const [order] = await db.insert(ordersTable).values({
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
      // Market sell: spend base coin, receive USDT
      const sellAmount = amount;
      const coinBal = await getCoinBalance(auth.userId, baseCurrency);
      if (coinBal < sellAmount) {
        res.status(400).json({ error: `Insufficient ${baseCurrency} balance` });
        return;
      }

      const receiveUsdt = sellAmount * currentPrice;

      // Deduct coin
      await upsertCoinBalance(auth.userId, baseCurrency, -sellAmount);

      // Credit USDT
      await db.update(usersTable)
        .set({ usdtBalance: (usdtBalance + receiveUsdt).toFixed(8) })
        .where(eq(usersTable.id, auth.userId));

      const [order] = await db.insert(ordersTable).values({
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
    // Limit order
    const orderPrice = limitPrice ?? currentPrice;

    if (side === "buy") {
      const reserveUsdt = amount * orderPrice;
      if (usdtBalance < reserveUsdt) {
        res.status(400).json({ error: "Insufficient USDT balance" });
        return;
      }
      // Reserve USDT
      await db.update(usersTable)
        .set({ usdtBalance: (usdtBalance - reserveUsdt).toFixed(8) })
        .where(eq(usersTable.id, auth.userId));
    } else {
      const coinBal = await getCoinBalance(auth.userId, baseCurrency);
      if (coinBal < amount) {
        res.status(400).json({ error: `Insufficient ${baseCurrency} balance` });
        return;
      }
      // Reserve coin
      await upsertCoinBalance(auth.userId, baseCurrency, -amount);
    }

    const total = amount * orderPrice;
    const [order] = await db.insert(ordersTable).values({
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
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, auth.userId)));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "open") {
    res.status(400).json({ error: "Only open orders can be cancelled" });
    return;
  }

  // Refund reserved balance
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId));
  const baseCurrency = order.symbol.replace(/USDT$/, "");
  const orderPrice = order.price ? parseFloat(order.price) : getCurrentPrice(baseCurrency) ?? 1;
  const orderAmount = parseFloat(order.amount);

  if (order.side === "buy") {
    const refundUsdt = orderAmount * orderPrice;
    await db.update(usersTable)
      .set({ usdtBalance: (parseFloat(user!.usdtBalance) + refundUsdt).toFixed(8) })
      .where(eq(usersTable.id, auth.userId));
  } else {
    await upsertCoinBalance(auth.userId, baseCurrency, orderAmount);
  }

  await db.update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, orderId));

  res.json({ success: true });
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
