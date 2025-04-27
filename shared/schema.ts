import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Mental health entry schema
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  mood: varchar("mood", { length: 20 }).notNull().$type<"Happy" | "Neutral" | "Sad" | "Angry" | "Tired">(),
  journalEntry: text("journal_entry").notNull(),
  sentiment: varchar("sentiment", { length: 20 }).$type<"Positive" | "Neutral" | "Negative">(),
  date: timestamp("date").defaultNow().notNull(),
  userId: serial("user_id").references(() => users.id),
});

export const insertEntrySchema = createInsertSchema(entries).omit({
  id: true,
  userId: true,
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

export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;

export type MoodType = "Happy" | "Neutral" | "Sad" | "Angry" | "Tired";
export type SentimentType = "Positive" | "Neutral" | "Negative";
