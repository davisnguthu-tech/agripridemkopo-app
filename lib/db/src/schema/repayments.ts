import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { loansTable } from "./loans";

export const repaymentsTable = pgTable("repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  mpesaReceipt: text("mpesa_receipt"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRepaymentSchema = createInsertSchema(repaymentsTable).omit({ id: true, createdAt: true });
export type InsertRepayment = z.infer<typeof insertRepaymentSchema>;
export type Repayment = typeof repaymentsTable.$inferSelect;
