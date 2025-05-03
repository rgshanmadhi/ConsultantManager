import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Subscription status query
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription info");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscribe");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription successful",
        description: "Thank you for subscribing to Serene!",
      });
      // Refresh subscription data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Could not process subscription",
        variant: "destructive",
      });
    },
  });

  // Handle subscription button click
  const handleSubscribe = () => {
    subscribeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscribed = subscription?.isSubscribed;
  const isInTrial = subscription?.isInTrial;
  const trialEndDate = subscription?.trialEndDate ? new Date(subscription.trialEndDate) : null;
  const daysLeft = trialEndDate 
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Subscription</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Subscription Status</CardTitle>
            <CardDescription>
              {isSubscribed 
                ? "You have an active subscription" 
                : isInTrial 
                  ? `You are in your trial period - ${daysLeft} days left` 
                  : "Your trial period has ended"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubscribed ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 dark:bg-green-900 rounded-md text-green-800 dark:text-green-100">
                  <p className="font-semibold">Active Subscription</p>
                  <p className="text-sm mt-1">
                    Your subscription is active. Enjoy all premium features of Serene.
                  </p>
                </div>
                {subscription?.subscription && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                      <p>{formatDate(subscription.subscription.currentPeriodStart)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                      <p>{formatDate(subscription.subscription.currentPeriodEnd)}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : isInTrial ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-md text-blue-800 dark:text-blue-100">
                  <p className="font-semibold">Trial Period</p>
                  <p className="text-sm mt-1">
                    You are currently in your 30-day free trial. You have {daysLeft} days
                    left before you need to subscribe.
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trial End Date</p>
                  <p>{trialEndDate ? formatDate(trialEndDate) : "Unknown"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-100 dark:bg-red-900 rounded-md text-red-800 dark:text-red-100">
                  <p className="font-semibold">Trial Expired</p>
                  <p className="text-sm mt-1">
                    Your trial period has ended. Please subscribe to continue using all features.
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trial End Date</p>
                  <p>{trialEndDate ? formatDate(trialEndDate) : "Expired"}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {!isSubscribed && (
              <Button 
                onClick={handleSubscribe} 
                disabled={subscribeMutation.isPending} 
                className="w-full md:w-auto"
              >
                {subscribeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            )}
            {isSubscribed && (
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                className="w-full md:w-auto"
              >
                Return to Dashboard
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>
              Our subscription plan and benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Premium Subscription</h3>
                <p className="text-3xl font-bold mb-4">$4.99 <span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Unlimited mood tracking and journaling</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Advanced mood analytics and reports</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Personalized activity recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Export your journal entries and data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Priority customer support</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Cancel anytime. Your data will remain accessible during your subscription period.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            {!isSubscribed && !subscribeMutation.isPending && (
              <Button 
                onClick={handleSubscribe} 
                className="w-full md:w-auto"
              >
                Subscribe Now
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}