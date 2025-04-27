import { users, type User, type InsertUser, entries, type Entry, type InsertEntry } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Entry methods
  createEntry(entry: InsertEntry): Promise<Entry>;
  getEntries(): Promise<Entry[]>;
  getEntriesByDate(date: Date): Promise<Entry[]>;
  getEntriesByDateRange(startDate: Date, endDate: Date): Promise<Entry[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createEntry(entry: InsertEntry): Promise<Entry> {
    const [newEntry] = await db
      .insert(entries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getEntries(): Promise<Entry[]> {
    return await db
      .select()
      .from(entries)
      .orderBy(desc(entries.date));
  }

  async getEntriesByDate(date: Date): Promise<Entry[]> {
    // Create a date range for the entire day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.getEntriesByDateRange(startDate, endDate);
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<Entry[]> {
    return await db
      .select()
      .from(entries)
      .where(
        // Between start and end date
        (builder) => builder
          .where(builder.gte(entries.date, startDate))
          .and(builder.lte(entries.date, endDate))
      )
      .orderBy(desc(entries.date));
  }
}

// Fallback to memory storage if database is not available
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private entriesMap: Map<number, Entry>;
  private currentUserId: number;
  private currentEntryId: number;

  constructor() {
    this.usersMap = new Map();
    this.entriesMap = new Map();
    this.currentUserId = 1;
    this.currentEntryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.usersMap.set(id, user);
    return user;
  }

  async createEntry(entry: InsertEntry): Promise<Entry> {
    const id = this.currentEntryId++;
    const now = new Date();
    const newEntry: Entry = { 
      ...entry, 
      id, 
      date: now,
      userId: 1 // Default user ID for in-memory storage
    };
    this.entriesMap.set(id, newEntry);
    return newEntry;
  }

  async getEntries(): Promise<Entry[]> {
    return Array.from(this.entriesMap.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getEntriesByDate(date: Date): Promise<Entry[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.getEntriesByDateRange(startDate, endDate);
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<Entry[]> {
    return Array.from(this.entriesMap.values())
      .filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

// Determine which storage to use based on DATABASE_URL
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
