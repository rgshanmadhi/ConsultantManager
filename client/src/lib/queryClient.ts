import { QueryClient } from "@tanstack/react-query";
import * as localStorageService from "./localStorageService";

// This file has been simplified since we're using local storage for data
// instead of making API calls

// Mock API request function for compatibility with existing code
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<{ json: () => any }> {
  // Simulate network delay for a more realistic feel
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock response object with json method
  return {
    json: () => {
      // This is just a stub - our actual data operations happen via localStorageService
      return {};
    }
  };
}

// Simple queryClient with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
