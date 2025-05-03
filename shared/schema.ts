import { z } from "zod";

// Define types
export type MoodType = "Happy" | "Neutral" | "Sad" | "Angry" | "Tired";
export type SentimentType = "Positive" | "Neutral" | "Negative";
export type SubscriptionStatus = "active" | "canceled" | "past_due";

// Type definitions for our models
export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  name: string | null;
  createdAt: Date;
  isSubscribed: boolean;
  trialEndDate: string | null; // ISO string for serialization
}

export interface Subscription {
  id: number;
  userId: number;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  plan: "monthly" | "annual";
}

export interface Entry {
  id: number;
  mood: MoodType;
  journalEntry: string;
  sentiment: SentimentType | null;
  date: Date;
  userId: number;
}

// Zod schemas for validation
export const userSchema = z.object({
  id: z.number(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Must be a valid email address"),
  name: z.string().nullable(),
  createdAt: z.date(),
  isSubscribed: z.boolean(),
  trialEndDate: z.string().nullable(),
});

export const subscriptionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  status: z.enum(["active", "canceled", "past_due"]),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  createdAt: z.date(),
  plan: z.enum(["monthly", "annual"]),
});

export const entrySchema = z.object({
  id: z.number(),
  mood: z.enum(["Happy", "Neutral", "Sad", "Angry", "Tired"]),
  journalEntry: z.string().min(1, "Journal entry is required"),
  sentiment: z.enum(["Positive", "Neutral", "Negative"]).nullable(),
  date: z.date(),
  userId: z.number(),
});

// Schemas for creating new instances (without auto-generated fields)
export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true,
  isSubscribed: true,
  trialEndDate: true 
});

export const insertSubscriptionSchema = subscriptionSchema.omit({ 
  id: true, 
  createdAt: true 
});

export const insertEntrySchema = entrySchema.omit({ 
  id: true
});

// Activity recommendations mapped by mood
export const activitiesMapping = {
  Happy: ["Share your happiness", "Practice gratitude", "Do something creative", "Compliment someone", "Try something new"],
  Neutral: ["Take a short walk", "Read a book", "Listen to music", "Connect with a friend", "Try mindfulness"],
  Sad: ["Practice self-care", "Take a walk outside", "Call a friend", "Listen to uplifting music", "Practice gratitude"],
  Angry: ["Take deep breaths", "Write down your feelings", "Exercise", "Practice meditation", "Talk to someone"],
  Tired: ["Take a power nap", "Drink some water", "Stretch your body", "Get some fresh air", "Listen to energizing music"]
};

// Type aliases for convenience
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
