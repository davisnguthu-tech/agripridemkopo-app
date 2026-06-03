import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ussdSessionsTable = pgTable("ussd_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  phone: text("phone").notNull(),
  state: text("state").notNull().default("main_menu"),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUssdSessionSchema = createInsertSchema(ussdSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUssdSession = z.infer<typeof insertUssdSessionSchema>;
export type UssdSession = typeof ussdSessionsTable.$inferSelect;
