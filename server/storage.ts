import { 
  users, type User, type InsertUser, 
  entries, type Entry, type InsertEntry,
  subscriptions, type Subscription, type InsertSubscription 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, gte } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription>;
  
  // Entry methods
  createEntry(entry: InsertEntry): Promise<Entry>;
  getEntries(userId: number): Promise<Entry[]>;
  getEntriesByDate(date: Date, userId: number): Promise<Entry[]>;
  getEntriesByDateRange(startDate: Date, endDate: Date, userId: number): Promise<Entry[]>;
  
  // Subscription validation
  isUserSubscribed(userId: number): Promise<boolean>;
  isUserInTrialPeriod(userId: number): Promise<boolean>;
  getTrialEndDate(userId: number): Promise<Date | null>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Set trial end date to 30 days from now
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        trialEndDate,
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Subscription methods
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    
    // Update user's subscription status
    await db
      .update(users)
      .set({ isSubscribed: true })
      .where(eq(users.id, subscription.userId));
    
    return newSubscription;
  }
  
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    
    return subscription;
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, id))
      .returning();
    
    // If subscription is canceled, update user status
    if (subscriptionData.status === "canceled") {
      await db
        .update(users)
        .set({ isSubscribed: false })
        .where(eq(users.id, updatedSubscription.userId));
    }
    
    return updatedSubscription;
  }

  // Entry methods
  async createEntry(entry: InsertEntry): Promise<Entry> {
    const [newEntry] = await db
      .insert(entries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getEntries(userId: number): Promise<Entry[]> {
    return await db
      .select()
      .from(entries)
      .where(eq(entries.userId, userId))
      .orderBy(desc(entries.date));
  }

  async getEntriesByDate(date: Date, userId: number): Promise<Entry[]> {
    // Create a date range for the entire day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.getEntriesByDateRange(startDate, endDate, userId);
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date, userId: number): Promise<Entry[]> {
    return await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.userId, userId),
          gte(entries.date, startDate),
          lt(entries.date, endDate)
        )
      )
      .orderBy(desc(entries.date));
  }
  
  // Subscription validation methods
  async isUserSubscribed(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    if (user.isSubscribed) return true;
    
    return await this.isUserInTrialPeriod(userId);
  }
  
  async isUserInTrialPeriod(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.trialEndDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trialEnd = new Date(user.trialEndDate);
    return today <= trialEnd;
  }
  
  async getTrialEndDate(userId: number): Promise<Date | null> {
    const user = await this.getUser(userId);
    if (!user || !user.trialEndDate) return null;
    
    return new Date(user.trialEndDate);
  }
}

// Fallback to memory storage if database is not available
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private entriesMap: Map<number, Entry>;
  private subscriptionsMap: Map<number, Subscription>;
  private currentUserId: number;
  private currentEntryId: number;
  private currentSubscriptionId: number;

  constructor() {
    this.usersMap = new Map();
    this.entriesMap = new Map();
    this.subscriptionsMap = new Map();
    this.currentUserId = 1;
    this.currentEntryId = 1;
    this.currentSubscriptionId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    // Set trial end date to 30 days from now
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      isSubscribed: false,
      trialEndDate
    };
    
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    
    return updatedUser;
  }
  
  // Subscription methods
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const now = new Date();
    
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: now
    };
    
    this.subscriptionsMap.set(id, newSubscription);
    
    // Update user's subscription status
    const user = this.usersMap.get(subscription.userId);
    if (user) {
      this.usersMap.set(subscription.userId, { ...user, isSubscribed: true });
    }
    
    return newSubscription;
  }
  
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values())
      .filter(sub => sub.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) throw new Error('Subscription not found');
    
    const updatedSubscription = { ...subscription, ...subscriptionData };
    this.subscriptionsMap.set(id, updatedSubscription);
    
    // If subscription is canceled, update user status
    if (subscriptionData.status === "canceled") {
      const user = this.usersMap.get(subscription.userId);
      if (user) {
        this.usersMap.set(subscription.userId, { ...user, isSubscribed: false });
      }
    }
    
    return updatedSubscription;
  }

  // Entry methods
  async createEntry(entry: InsertEntry): Promise<Entry> {
    const id = this.currentEntryId++;
    const now = new Date();
    const newEntry: Entry = { 
      ...entry, 
      id, 
      date: now
    };
    this.entriesMap.set(id, newEntry);
    return newEntry;
  }

  async getEntries(userId: number): Promise<Entry[]> {
    return Array.from(this.entriesMap.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getEntriesByDate(date: Date, userId: number): Promise<Entry[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.getEntriesByDateRange(startDate, endDate, userId);
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date, userId: number): Promise<Entry[]> {
    return Array.from(this.entriesMap.values())
      .filter(entry => 
        entry.userId === userId &&
        entry.date >= startDate && 
        entry.date <= endDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Subscription validation methods
  async isUserSubscribed(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    if (user.isSubscribed) return true;
    
    return await this.isUserInTrialPeriod(userId);
  }
  
  async isUserInTrialPeriod(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.trialEndDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trialEnd = new Date(user.trialEndDate);
    return today <= trialEnd;
  }
  
  async getTrialEndDate(userId: number): Promise<Date | null> {
    const user = await this.getUser(userId);
    if (!user || !user.trialEndDate) return null;
    
    return new Date(user.trialEndDate);
  }
}

// Determine which storage to use based on DATABASE_URL
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
