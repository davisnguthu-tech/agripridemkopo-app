import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";

export const loanApplicationsTable = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id),
  amountRequested: numeric("amount_requested", { precision: 12, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  aiScore: numeric("ai_score", { precision: 5, scale: 2 }),
  aiRecommendation: text("ai_recommendation"),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type LoanApplication = typeof loanApplicationsTable.$inferSelect;
