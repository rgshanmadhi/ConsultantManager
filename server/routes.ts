import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEntrySchema, insertUserSchema, insertSubscriptionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import memorystore from "memorystore";

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  const MemoryStore = memorystore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'serene-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Password hashing function
  function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }
  
  // Middleware to check if user is authenticated
  function isAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Middleware to check subscription status
  async function checkSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const isSubscribed = await storage.isUserSubscribed(req.session.userId);
    
    if (!isSubscribed) {
      return res.status(402).json({ message: 'Subscription required' });
    }
    
    next();
  }
  
  // Sentiment analysis function
  function analyzeSentiment(text: string): "Positive" | "Neutral" | "Negative" {
    // Simple sentiment analysis based on keyword matching
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
  }

  // Authentication routes
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash password
      const hashedPassword = hashPassword(userData.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Failed to register user' });
      }
    }
  });
  
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const hashedPassword = hashPassword(password);
      
      if (hashedPassword !== user.password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Failed to log in' });
    }
  });
  
  app.post('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/user', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      // Add subscription status
      const isSubscribed = await storage.isUserSubscribed(user.id);
      const trialEndDate = await storage.getTrialEndDate(user.id);
      const isInTrial = await storage.isUserInTrialPeriod(user.id);
      
      res.json({
        ...userWithoutPassword,
        isSubscribed,
        trialEndDate,
        isInTrial
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
  
  // Subscription routes (simulated without Stripe)
  app.post('/api/subscribe', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      
      // Create a simulated subscription
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
      
      const subscription = await storage.createSubscription({
        userId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      });
      
      res.status(201).json({ 
        message: 'Subscription created successfully',
        subscription
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });
  
  app.get('/api/subscription', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.userId;
      
      const subscription = await storage.getSubscriptionByUserId(userId);
      const isSubscribed = await storage.isUserSubscribed(userId);
      const trialEndDate = await storage.getTrialEndDate(userId);
      const isInTrial = await storage.isUserInTrialPeriod(userId);
      
      res.json({
        subscription,
        isSubscribed,
        trialEndDate,
        isInTrial
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Entry routes
  app.post('/api/entries', isAuthenticated, checkSubscription, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entryData = insertEntrySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      // Perform sentiment analysis if not provided
      if (!entryData.sentiment) {
        entryData.sentiment = analyzeSentiment(entryData.journalEntry);
      }
      
      const newEntry = await storage.createEntry(entryData);
      res.status(201).json(newEntry);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error('Error creating entry:', error);
        res.status(500).json({ message: 'Failed to create entry' });
      }
    }
  });

  app.get('/api/entries', isAuthenticated, checkSubscription, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entries = await storage.getEntries(req.session.userId);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      res.status(500).json({ message: 'Failed to fetch entries' });
    }
  });

  app.get('/api/entries/:date', isAuthenticated, checkSubscription, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const date = new Date(req.params.date);
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      
      const entries = await storage.getEntriesByDate(date, req.session.userId);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching entries by date:', error);
      res.status(500).json({ message: 'Failed to fetch entries' });
    }
  });

  app.get('/api/analyze-sentiment', isAuthenticated, (req: Request, res: Response) => {
    const { text } = req.query;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text parameter is required' });
    }
    
    const sentiment = analyzeSentiment(text);
    res.json({ sentiment });
  });

  const httpServer = createServer(app);

  return httpServer;
}
