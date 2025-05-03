/**
 * This file is a stub since we're using client-side storage.
 * See client/src/lib/localStorageService.ts for the actual implementation.
 */

// Empty interface to satisfy the type system
export interface IStorage {
  // This is just a stub
}

// Empty class to satisfy the type system
class MemStorage implements IStorage {
  // This is just a stub
}

// Export an empty storage object
export const storage = new MemStorage();