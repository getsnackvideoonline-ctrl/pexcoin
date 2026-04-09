import { pgTable, text, serial, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }),
  status: text("status").notNull().default("open"),
  filledAmount: decimal("filled_amount", { precision: 20, scale: 8 }).notNull().default("0"),
  avgPrice: decimal("avg_price", { precision: 20, scale: 8 }),
  total: decimal("total", { precision: 20, scale: 8 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Order = typeof ordersTable.$inferSelect;
