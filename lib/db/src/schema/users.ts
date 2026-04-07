import { pgTable, text, serial, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  usdtBalance: decimal("usdt_balance", { precision: 20, scale: 8 }).notNull().default("0"),
  btcBalance: decimal("btc_balance", { precision: 20, scale: 8 }).notNull().default("0"),
  ethBalance: decimal("eth_balance", { precision: 20, scale: 8 }).notNull().default("0"),
  inviteCode: text("invite_code").notNull().unique(),
  referredBy: integer("referred_by").references((): any => usersTable.id),
  commissionEarned: decimal("commission_earned", { precision: 20, scale: 8 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
