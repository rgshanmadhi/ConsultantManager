import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          // User is already logged in, redirect to dashboard
          setLocation("/");
        }
      } catch (error) {
        // Not logged in, stay on auth page
      }
    };
    
    checkAuth();
  }, [setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      name: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/login", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome back to Serene!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/");
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
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Welcome to Serene! You have a 30-day free trial.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Handle login form submission
  const handleLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const handleRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to Serene
            </CardTitle>
            <CardDescription className="text-center">
              Your personal mental health companion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username"
                              {...field}
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create a password"
                              {...field}
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending
                        ? "Creating account..."
                        : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              {activeTab === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Button
                variant="link"
                className="p-0"
                onClick={() =>
                  setActiveTab(activeTab === "login" ? "register" : "login")
                }
              >
                {activeTab === "login" ? "Register" : "Login"}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero */}
      <div className="hidden bg-slate-800 text-white flex-1 p-10 md:flex flex-col justify-center">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-6">Serene</h1>
          <h2 className="text-2xl font-semibold mb-4">
            Your Daily Mental Health Companion
          </h2>
          <p className="text-lg mb-6">
            Track your mood, journal your thoughts, and get personalized activity
            recommendations to improve your mental well-being.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gradient-to-r from-cyan-500 to-indigo-500">
                ✓
              </div>
              <p>Daily mood tracking with emotional insights</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gradient-to-r from-indigo-500 to-purple-500">
                ✓
              </div>
              <p>Journaling with sentiment analysis</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gradient-to-r from-purple-500 to-pink-500">
                ✓
              </div>
              <p>Personalized activity recommendations</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gradient-to-r from-pink-500 to-rose-500">
                ✓
              </div>
              <p>Visualize your mood trends over time</p>
            </div>
          </div>
          <p className="mt-8 text-sm">
            Free 30-day trial, then upgrade to our subscription for continued access
          </p>
        </div>
      </div>
    </div>
  );
}