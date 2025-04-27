import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEntrySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // API routes
  app.post('/api/entries', async (req: Request, res: Response) => {
    try {
      const entryData = insertEntrySchema.parse(req.body);
      
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

  app.get('/api/entries', async (_req: Request, res: Response) => {
    try {
      const entries = await storage.getEntries();
      res.json(entries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      res.status(500).json({ message: 'Failed to fetch entries' });
    }
  });

  app.get('/api/entries/:date', async (req: Request, res: Response) => {
    try {
      const date = new Date(req.params.date);
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      
      const entries = await storage.getEntriesByDate(date);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching entries by date:', error);
      res.status(500).json({ message: 'Failed to fetch entries' });
    }
  });

  app.get('/api/analyze-sentiment', (req: Request, res: Response) => {
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
