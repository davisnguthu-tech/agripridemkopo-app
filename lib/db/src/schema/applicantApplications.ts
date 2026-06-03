import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";

export const applicantApplications = pgTable("applicant_applications", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  applicantName: text("applicant_name"),
  phone: text("phone"),
  amountRequested: numeric("amount_requested", { precision: 15, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  county: text("county").notNull(),
  farmSizeAcres: numeric("farm_size_acres", { precision: 10, scale: 2 }).notNull(),
  cropType: text("crop_type").notNull(),
  monthlyIncome: numeric("monthly_income", { precision: 15, scale: 2 }),
  existingDebt: numeric("existing_debt", { precision: 15, scale: 2 }).default("0"),
  status: text("status").notNull().default("pending"),
  agent1Score: integer("agent1_score"),
  agent1Review: text("agent1_review"),
  agent2Score: integer("agent2_score"),
  agent2Review: text("agent2_review"),
  finalScore: integer("final_score"),
  finalDecision: text("final_decision"),
  finalReason: text("final_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export type ApplicantApplication = typeof applicantApplications.$inferSelect;
export type NewApplicantApplication = typeof applicantApplications.$inferInsert;
