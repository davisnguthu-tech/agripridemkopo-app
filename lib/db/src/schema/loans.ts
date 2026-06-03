import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";
import { loanApplicationsTable } from "./loanApplications";

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => loanApplicationsTable.id),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull().default("12.00"),
  status: text("status").notNull().default("approved"), // approved | disbursed | repaid | defaulted
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  disbursedAt: timestamp("disbursed_at", { withTimezone: true }),
  mpesaReceipt: text("mpesa_receipt"),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
