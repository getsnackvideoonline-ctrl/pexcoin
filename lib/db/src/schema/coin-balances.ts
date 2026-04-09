import { pgTable, text, serial, decimal, integer, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const coinBalancesTable = pgTable("coin_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  symbol: text("symbol").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull().default("0"),
}, (t) => [unique().on(t.userId, t.symbol)]);

export type CoinBalance = typeof coinBalancesTable.$inferSelect;
