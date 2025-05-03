import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import * as localStorageService from "@/lib/localStorageService";
import CryptoJS from 'crypto-js';
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  isUserInTrial: boolean;
};

type LoginData = {
  username: string;
  password: string;
};

// Simple hash function to replace the server-side hashing
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUserInTrial, setIsUserInTrial] = useState(false);

  // Initialize local storage and check for current user
  useEffect(() => {
    try {
      // Initialize the local storage with demo data if needed
      localStorageService.initLocalStorage();
      
      // Get current user from local storage
      const currentUser = localStorageService.getCurrentUser();
      setUser(currentUser);
      
      // Check if user is in trial
      if (currentUser) {
        setIsUserInTrial(localStorageService.isUserInTrialPeriod(currentUser.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hashedPassword = hashPassword(credentials.password);
      const user = localStorageService.getUserByUsername(credentials.username);
      
      if (!user || user.password !== hashedPassword) {
        throw new Error('Invalid username or password');
      }
      
      // Set current user in local storage
      localStorageService.setCurrentUser(user);
      
      // Check if user is in trial
      setIsUserInTrial(localStorageService.isUserInTrialPeriod(user.id));
      
      return user;
    },
    onSuccess: (loggedInUser: User) => {
      setUser(loggedInUser);
      toast({
        title: "Login successful",
        description: `Welcome back, ${loggedInUser.name || loggedInUser.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if username already exists
      const existingUsername = localStorageService.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
      
      // Check if email already exists
      const existingEmail = localStorageService.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
      
      // Hash password
      const hashedPassword = hashPassword(userData.password);
      
      // Create user
      const newUser = localStorageService.createUser({
        ...userData,
        password: hashedPassword,
        isSubscribed: false,
        trialEndDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      });
      
      // Set current user in local storage
      localStorageService.setCurrentUser(newUser);
      
      // User is in trial by default
      setIsUserInTrial(true);
      
      return newUser;
    },
    onSuccess: (newUser: User) => {
      setUser(newUser);
      toast({
        title: "Registration successful",
        description: `Welcome to Serene, ${newUser.name || newUser.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Clear current user from local storage
      localStorageService.setCurrentUser(null);
    },
    onSuccess: () => {
      setUser(null);
      setIsUserInTrial(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isUserInTrial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}