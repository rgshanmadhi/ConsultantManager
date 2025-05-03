import { User, Entry, Subscription, MoodType, SentimentType } from "@shared/schema";

// Keys for localStorage
const USERS_KEY = 'serene_users';
const CURRENT_USER_KEY = 'serene_current_user';
const ENTRIES_KEY = 'serene_entries';
const SUBSCRIPTIONS_KEY = 'serene_subscriptions';

// Helper to get/set data from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage:`, e);
    return defaultValue;
  }
};

const setToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// User management
export const getUsers = (): User[] => {
  return getFromStorage<User[]>(USERS_KEY, []);
};

export const getCurrentUser = (): User | null => {
  return getFromStorage<User | null>(CURRENT_USER_KEY, null);
};

export const setCurrentUser = (user: User | null): void => {
  setToStorage(CURRENT_USER_KEY, user);
};

export const getUserByUsername = (username: string): User | undefined => {
  const users = getUsers();
  return users.find((user) => user.username === username);
};

export const getUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find((user) => user.email === email);
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  
  // Create user with default values
  const newUser: User = {
    ...userData,
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    createdAt: new Date(),
    isSubscribed: false,
    trialEndDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
  };
  
  // Add to users array and save
  users.push(newUser);
  setToStorage(USERS_KEY, users);
  
  return newUser;
};

export const updateUser = (id: number, userData: Partial<User>): User => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error(`User with id ${id} not found`);
  }
  
  // Update user data
  const updatedUser = { ...users[index], ...userData };
  users[index] = updatedUser;
  
  // Save to storage
  setToStorage(USERS_KEY, users);
  
  // If this is the current user, update current user too
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === id) {
    setCurrentUser(updatedUser);
  }
  
  return updatedUser;
};

// Entry management
export const getEntries = (): Entry[] => {
  return getFromStorage<Entry[]>(ENTRIES_KEY, []);
};

export const getUserEntries = (userId: number): Entry[] => {
  const entries = getEntries();
  return entries.filter(entry => entry.userId === userId);
};

export const createEntry = (entryData: Omit<Entry, 'id'>): Entry => {
  const entries = getEntries();
  
  // Create entry with ID
  const newEntry: Entry = {
    ...entryData,
    id: entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1,
  };
  
  // Analyze sentiment if not provided
  if (!newEntry.sentiment) {
    newEntry.sentiment = analyzeSentiment(newEntry.journalEntry);
  }
  
  // Add to entries array and save
  entries.push(newEntry);
  setToStorage(ENTRIES_KEY, entries);
  
  return newEntry;
};

// Subscription management
export const getSubscriptions = (): Subscription[] => {
  return getFromStorage<Subscription[]>(SUBSCRIPTIONS_KEY, []);
};

export const getUserSubscription = (userId: number): Subscription | undefined => {
  const subscriptions = getSubscriptions();
  // Get the most recent subscription
  return subscriptions
    .filter(sub => sub.userId === userId)
    .sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
};

export const createSubscription = (subData: Omit<Subscription, 'id' | 'createdAt'>): Subscription => {
  const subscriptions = getSubscriptions();
  
  // Create subscription
  const newSubscription: Subscription = {
    ...subData,
    id: subscriptions.length > 0 ? Math.max(...subscriptions.map(s => s.id)) + 1 : 1,
    createdAt: new Date(),
  };
  
  // Add to subscriptions array and save
  subscriptions.push(newSubscription);
  setToStorage(SUBSCRIPTIONS_KEY, subscriptions);
  
  // Update user subscription status
  const user = getCurrentUser();
  if (user && user.id === subData.userId) {
    updateUser(user.id, { isSubscribed: true });
  }
  
  return newSubscription;
};

// Subscription validation
export const isUserSubscribed = (userId: number): boolean => {
  const user = getUsers().find(u => u.id === userId);
  if (!user) return false;
  
  if (user.isSubscribed) return true;
  
  return isUserInTrialPeriod(userId);
};

export const isUserInTrialPeriod = (userId: number): boolean => {
  const user = getUsers().find(u => u.id === userId);
  if (!user || !user.trialEndDate) return false;
  
  const today = new Date();
  const trialEnd = new Date(user.trialEndDate);
  
  return today <= trialEnd;
};

export const getTrialEndDate = (userId: number): Date | null => {
  const user = getUsers().find(u => u.id === userId);
  if (!user || !user.trialEndDate) return null;
  
  return new Date(user.trialEndDate);
};

// Helper function - simple sentiment analysis
export const analyzeSentiment = (text: string): SentimentType => {
  // Simple keyword-based sentiment analysis
  const positiveWords = ['happy', 'great', 'good', 'excellent', 'wonderful', 'love', 'enjoy', 'positive', 'awesome', 'amazing'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'upset', 'disappointed', 'negative', 'anxious', 'stress', 'worried'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of words) {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  }
  
  if (positiveCount > negativeCount) return "Positive";
  if (negativeCount > positiveCount) return "Negative";
  return "Neutral";
};

// Init method to seed some data if needed
export const initLocalStorage = (): void => {
  // Check if we already have data
  const users = getUsers();
  if (users.length === 0) {
    // Add a test user
    const demoUser: Omit<User, 'id' | 'createdAt'> = {
      username: 'demo',
      password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // password: 'password'
      email: 'demo@example.com',
      name: 'Demo User',
      isSubscribed: false,
      trialEndDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    };
    
    createUser(demoUser);
  }
};