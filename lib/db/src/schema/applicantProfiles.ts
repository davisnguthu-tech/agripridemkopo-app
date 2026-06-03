import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const applicantProfiles = pgTable("applicant_profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  nationalId: text("national_id"),
  county: text("county"),
  farmSizeAcres: numeric("farm_size_acres", { precision: 10, scale: 2 }),
  cropType: text("crop_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ApplicantProfile = typeof applicantProfiles.$inferSelect;
export type NewApplicantProfile = typeof applicantProfiles.$inferInsert;
