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

// Helper function - enhanced sentiment analysis
export const analyzeSentiment = (text: string): SentimentType => {
  // Enhanced keyword-based sentiment analysis with weighted scoring
  const positiveWords = [
    { word: 'happy', weight: 2 },
    { word: 'great', weight: 2 },
    { word: 'good', weight: 1 },
    { word: 'excellent', weight: 3 },
    { word: 'wonderful', weight: 3 },
    { word: 'love', weight: 2 },
    { word: 'enjoy', weight: 1 },
    { word: 'positive', weight: 1 },
    { word: 'awesome', weight: 2 },
    { word: 'amazing', weight: 2 },
    { word: 'grateful', weight: 2 },
    { word: 'thankful', weight: 2 },
    { word: 'exciting', weight: 2 },
    { word: 'pleased', weight: 1 },
    { word: 'joy', weight: 2 },
    { word: 'proud', weight: 2 },
    { word: 'blessed', weight: 2 },
    { word: 'fun', weight: 1 },
    { word: 'peaceful', weight: 2 },
    { word: 'calm', weight: 1 }
  ];
  
  const negativeWords = [
    { word: 'sad', weight: 2 },
    { word: 'bad', weight: 1 },
    { word: 'terrible', weight: 3 },
    { word: 'awful', weight: 3 },
    { word: 'hate', weight: 3 },
    { word: 'upset', weight: 2 },
    { word: 'disappointed', weight: 2 },
    { word: 'negative', weight: 1 },
    { word: 'anxious', weight: 2 },
    { word: 'stress', weight: 2 },
    { word: 'worried', weight: 2 },
    { word: 'frustrated', weight: 2 },
    { word: 'angry', weight: 2 },
    { word: 'depressed', weight: 3 },
    { word: 'annoyed', weight: 1 },
    { word: 'lonely', weight: 2 },
    { word: 'afraid', weight: 2 },
    { word: 'miserable', weight: 3 },
    { word: 'exhausted', weight: 1 },
    { word: 'tired', weight: 1 }
  ];
  
  // Check for negation words
  const negationWords = ['not', 'no', 'never', "don't", "doesn't", "didn't", "can't", "won't", "isn't"];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Process more complex sentiment patterns
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[.,!?;:]/g, ''); // Remove punctuation
    let isNegated = false;
    
    // Check if the word is negated by looking at previous words
    if (i > 0) {
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (negationWords.includes(words[j].replace(/[.,!?;:]/g, ''))) {
          isNegated = true;
          break;
        }
      }
    }
    
    // Check for positive words and apply negation if needed
    const positiveMatch = positiveWords.find(pw => pw.word === word);
    if (positiveMatch) {
      if (isNegated) {
        negativeScore += positiveMatch.weight;
      } else {
        positiveScore += positiveMatch.weight;
      }
    }
    
    // Check for negative words and apply negation if needed
    const negativeMatch = negativeWords.find(nw => nw.word === word);
    if (negativeMatch) {
      if (isNegated) {
        positiveScore += negativeMatch.weight * 0.5; // Negated negative is slightly positive
      } else {
        negativeScore += negativeMatch.weight;
      }
    }
  }
  
  // Check for phrases that indicate stronger sentiment
  const lowerText = text.toLowerCase();
  const veryPositivePhrases = ['really happy', 'very good', 'so excited', 'love it', 'very grateful'];
  const veryNegativePhrases = ['really sad', 'very bad', 'so angry', 'hate it', 'very anxious'];
  
  veryPositivePhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      positiveScore += 3;
    }
  });
  
  veryNegativePhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      negativeScore += 3;
    }
  });
  
  // Calculate sentiment score with a bias towards neutral for short texts
  const textLength = words.length;
  const sentimentThreshold = Math.min(3, Math.max(1, Math.floor(textLength / 20)));
  
  const scoreDifference = positiveScore - negativeScore;
  
  if (scoreDifference > sentimentThreshold) return "Positive";
  if (scoreDifference < -sentimentThreshold) return "Negative";
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