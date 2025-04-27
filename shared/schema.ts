import { pgTable, text, serial, timestamp, varchar, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with subscription fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isSubscribed: boolean("is_subscribed").default(false).notNull(),
  trialEndDate: date("trial_end_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Subscription schema for handling payments and subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<"active" | "canceled" | "past_due">(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});

// Mental health entry schema
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  mood: varchar("mood", { length: 20 }).notNull().$type<MoodType>(),
  journalEntry: text("journal_entry").notNull(),
  sentiment: varchar("sentiment", { length: 20 }).$type<SentimentType>(),
  date: timestamp("date").defaultNow().notNull(),
  userId: serial("user_id").references(() => users.id).notNull(),
});

export const insertEntrySchema = createInsertSchema(entries).omit({
  id: true,
});

export const activitiesMapping = {
  Happy: ["Share your happiness", "Practice gratitude", "Do something creative", "Compliment someone", "Try something new"],
  Neutral: ["Take a short walk", "Read a book", "Listen to music", "Connect with a friend", "Try mindfulness"],
  Sad: ["Practice self-care", "Take a walk outside", "Call a friend", "Listen to uplifting music", "Practice gratitude"],
  Angry: ["Take deep breaths", "Write down your feelings", "Exercise", "Practice meditation", "Talk to someone"],
  Tired: ["Take a power nap", "Drink some water", "Stretch your body", "Get some fresh air", "Listen to energizing music"]
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;

export type MoodType = "Happy" | "Neutral" | "Sad" | "Angry" | "Tired";
export type SentimentType = "Positive" | "Neutral" | "Negative";
