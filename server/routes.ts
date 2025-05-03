import { type Express } from "express";
import { createServer, type Server } from "http";

/**
 * This file has been simplified since we're using a client-side only approach.
 * All the authentication, entries, and subscription logic is now handled in the browser
 * through client/src/lib/localStorageService.ts.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Redirect all API requests to the root so our client-side app catches them
  app.all('/api/*', (req, res) => {
    res.status(200).json({ message: 'This application now runs entirely in the browser' });
  });

  return createServer(app);
}
