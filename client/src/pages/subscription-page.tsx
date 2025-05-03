import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckIcon, Loader2, CreditCard } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  
  // Fetch subscription info
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscribe");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription created",
        description: "Your subscription has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating subscription",
        description: error.message || "There was a problem creating your subscription.",
        variant: "destructive",
      });
    },
  });
  
  // Subscription pricing
  const pricing = {
    monthly: {
      price: 9.99,
      period: "month"
    },
    annual: {
      price: 89.99,
      period: "year",
      savings: "25%"
    }
  };
  
  // Features list
  const features = [
    "Unlimited journal entries",
    "Advanced mood analytics and insights",
    "Access to all wellness activities",
    "Personalized recommendations",
    "Full historical data access",
    "Priority support"
  ];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  // Calculate next billing date
  const getNextBillingDate = () => {
    if (subscription?.subscription?.currentPeriodEnd) {
      return formatDate(subscription.subscription.currentPeriodEnd);
    }
    
    const today = new Date();
    return format(addMonths(today, 1), "MMMM d, yyyy");
  };
  
  // Get subscription status text
  const getSubscriptionStatus = () => {
    if (!user) return "";
    
    if (user.isSubscribed) {
      return "Active";
    } else if (user.isInTrial) {
      return "Free Trial";
    } else {
      return "Expired";
    }
  };
  
  // Get remaining trial days
  const getRemainingTrialDays = () => {
    if (!user || !user.trialEndDate) return 0;
    
    const trialEnd = new Date(user.trialEndDate);
    const today = new Date();
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };
  
  // Handle subscription button click
  const handleSubscribe = () => {
    setConfirmDialogOpen(true);
  };
  
  // Confirm subscription
  const confirmSubscription = () => {
    createSubscriptionMutation.mutate();
    setConfirmDialogOpen(false);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription plan and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading subscription information...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Status</span>
                    <p className="font-medium">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        user?.isSubscribed 
                          ? "bg-green-500" 
                          : user?.isInTrial 
                          ? "bg-amber-500" 
                          : "bg-red-500"
                      }`}></span>
                      {getSubscriptionStatus()}
                    </p>
                  </div>
                  
                  {user?.isSubscribed && (
                    <div>
                      <span className="text-muted-foreground text-sm">Next billing date</span>
                      <p className="font-medium">{getNextBillingDate()}</p>
                    </div>
                  )}
                  
                  {user?.isInTrial && (
                    <div>
                      <span className="text-muted-foreground text-sm">Trial ends in</span>
                      <p className="font-medium">{getRemainingTrialDays()} days</p>
                    </div>
                  )}
                  
                  {user?.isSubscribed && (
                    <div>
                      <span className="text-muted-foreground text-sm">Plan</span>
                      <p className="font-medium">
                        {subscription?.subscription?.plan === "annual" 
                          ? "Annual Plan ($89.99/year)" 
                          : "Monthly Plan ($9.99/month)"}
                      </p>
                    </div>
                  )}
                </div>
                
                {!user?.isSubscribed && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-amber-800 dark:text-amber-300 text-sm">
                      {user?.isInTrial 
                        ? `Your free trial will expire in ${getRemainingTrialDays()} days. Subscribe now to continue enjoying all features.` 
                        : "Your trial has expired. Subscribe to regain access to all features."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {!user?.isSubscribed && (
            <CardFooter>
              <Button 
                onClick={handleSubscribe}
                disabled={createSubscriptionMutation.isPending}
              >
                {createSubscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {user?.isInTrial ? "Upgrade Now" : "Subscribe Now"}
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
        
        {/* Subscription Plans */}
        {!user?.isSubscribed && (
          <Card>
            <CardHeader>
              <CardTitle>Choose a Plan</CardTitle>
              <CardDescription>
                Select the subscription plan that works best for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs 
                defaultValue="monthly" 
                value={selectedPlan}
                onValueChange={(value) => setSelectedPlan(value as "monthly" | "annual")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="annual">Annual <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">Save 25%</span></TabsTrigger>
                </TabsList>
                
                <TabsContent value="monthly" className="mt-6">
                  <div className="flex justify-between items-center p-6 border rounded-lg">
                    <div>
                      <h3 className="text-xl font-bold">${pricing.monthly.price}</h3>
                      <p className="text-muted-foreground">per {pricing.monthly.period}</p>
                    </div>
                    <Button onClick={handleSubscribe}>Subscribe Monthly</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="annual" className="mt-6">
                  <div className="flex justify-between items-center p-6 border rounded-lg border-primary/20 bg-primary/5">
                    <div>
                      <h3 className="text-xl font-bold">${pricing.annual.price}</h3>
                      <p className="text-muted-foreground">per {pricing.annual.period}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save {pricing.annual.savings} compared to monthly
                      </p>
                    </div>
                    <Button onClick={handleSubscribe}>Subscribe Yearly</Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">What's included:</h3>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Payment Method (Simulated) */}
        {user?.isSubscribed && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Your saved payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center border p-4 rounded-md">
                <CreditCard className="h-5 w-5 mr-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Subscription Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to subscribe to the {selectedPlan === "monthly" ? "Monthly" : "Annual"} plan 
              at ${selectedPlan === "monthly" ? pricing.monthly.price : pricing.annual.price} 
              per {selectedPlan === "monthly" ? "month" : "year"}.
              
              <div className="mt-4 p-4 bg-background border rounded-md">
                <p className="text-sm text-foreground">
                  <strong>Note:</strong> This is a simulated transaction for demonstration purposes. 
                  No actual payment will be processed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubscription}>
              Confirm Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}