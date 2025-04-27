import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { apiRequest } from "./queryClient";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          setLocation("/auth");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setLocation("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}