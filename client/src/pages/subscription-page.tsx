import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addMonths, addYears } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  X,
  Sparkle,
  LifeBuoy,
  LineChart,
  Unlock,
  Loader2,
} from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  // Fetch subscription info
  const {
    data: subscriptionData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (plan: "monthly" | "annual") => {
      setIsPaymentProcessing(true);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await apiRequest("POST", "/api/subscribe", { plan });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription successful",
        description: "Thank you for subscribing to Serene Premium!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsPaymentProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "There was a problem processing your subscription.",
        variant: "destructive",
      });
      setIsPaymentProcessing(false);
    },
  });
  
  // Handle subscription
  const handleSubscribe = () => {
    subscribeMutation.mutate(selectedPlan);
  };
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  // Calculate current period dates
  const getCurrentPeriodDates = () => {
    const today = new Date();
    let endDate;
    
    if (selectedPlan === "monthly") {
      endDate = addMonths(today, 1);
    } else {
      endDate = addYears(today, 1);
    }
    
    return {
      startDate: format(today, "MMMM d, yyyy"),
      endDate: format(endDate, "MMMM d, yyyy"),
    };
  };
  
  // Plans data
  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      price: "$9.99",
      billingPeriod: "per month",
      benefits: [
        "Unlimited journal entries",
        "Full access to all activities",
        "Advanced mood analytics",
        "Cancel anytime",
      ],
      mostPopular: false,
    },
    {
      id: "annual",
      name: "Annual",
      price: "$89.99",
      billingPeriod: "per year",
      benefits: [
        "All Monthly plan features",
        "Save 25% compared to monthly",
        "Priority customer support",
        "Export journal data",
      ],
      mostPopular: true,
    },
  ];
  
  // Calculate trial days left
  const getTrialDaysLeft = () => {
    if (!user?.trialEndDate) return 0;
    
    const today = new Date();
    const endDate = new Date(user.trialEndDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  const trialDaysLeft = getTrialDaysLeft();
  const { startDate, endDate } = getCurrentPeriodDates();
  
  // Show subscription status based on user data
  const SubscriptionStatus = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (isError) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load subscription information. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (user?.isSubscribed && subscriptionData?.subscription) {
      const { subscription } = subscriptionData;
      
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Subscription</CardTitle>
                <CardDescription>Your subscription is currently active</CardDescription>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="font-medium">{subscription.plan === "monthly" ? "Monthly" : "Annual"} Plan</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-medium">
                  {subscription.plan === "monthly" ? "$9.99 / month" : "$89.99 / year"}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Current Period Start</div>
                <div className="font-medium">{formatDate(subscription.currentPeriodStart)}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Current Period End</div>
                <div className="font-medium">{formatDate(subscription.currentPeriodEnd)}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Payment Method</div>
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium">•••• •••• •••• 4242</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Manage Subscription</Button>
          </CardFooter>
        </Card>
      );
    }
    
    if (user?.isInTrial) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Free Trial</CardTitle>
                <CardDescription>You're currently on a free trial</CardDescription>
              </div>
              <Badge className="bg-blue-500 hover:bg-blue-600">Trial</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Days remaining</span>
                <span className="font-medium">{trialDaysLeft} days</span>
              </div>
              <Progress value={(trialDaysLeft / 30) * 100} />
            </div>
            
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Trial ending soon</AlertTitle>
              <AlertDescription>
                Your free trial will end on {formatDate(user.trialEndDate)}. Subscribe to continue using all features.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>
              Subscribe Now
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    // Trial expired
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trial Expired</CardTitle>
              <CardDescription>Your free trial has ended</CardDescription>
            </div>
            <Badge variant="destructive">Expired</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Limited</AlertTitle>
            <AlertDescription>
              Your free trial has expired. Subscribe now to regain access to all features.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>
            Subscribe Now
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and payment details
          </p>
        </div>
        
        {/* Subscription Status Card */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Subscription Status</h2>
          <SubscriptionStatus />
        </div>
        
        {/* Show subscription plans if not already subscribed */}
        {(!user?.isSubscribed || isLoading) && (
          <div className="space-y-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Choose a Plan</h2>
              <p className="text-muted-foreground">
                Select the plan that works best for you
              </p>
            </div>
            
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                <TabsTrigger value="features">Features Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="plans" className="space-y-4 pt-4">
                <RadioGroup
                  value={selectedPlan}
                  onValueChange={(value) => setSelectedPlan(value as "monthly" | "annual")}
                  className="grid gap-4 md:grid-cols-2"
                >
                  {plans.map((plan) => (
                    <Label
                      key={plan.id}
                      htmlFor={plan.id}
                      className={`relative flex cursor-pointer flex-col rounded-lg border bg-card p-4 ${
                        selectedPlan === plan.id ? "border-primary" : "hover:border-primary/50"
                      }`}
                    >
                      {plan.mostPopular && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-primary">Most Popular</Badge>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <div className="space-y-2">
                          <div className="font-medium">{plan.name} Plan</div>
                          <div className="text-sm text-muted-foreground">{plan.billingPeriod}</div>
                          <div className="flex items-baseline">
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-sm text-muted-foreground ml-1">{plan.billingPeriod}</span>
                          </div>
                          
                          <ul className="space-y-2 mt-4">
                            {plan.benefits.map((benefit, i) => (
                              <li key={i} className="flex text-sm">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{selectedPlan === "monthly" ? "Monthly" : "Annual"} Plan</span>
                        <span>{selectedPlan === "monthly" ? "$9.99" : "$89.99"}</span>
                      </div>
                      
                      {selectedPlan === "annual" && (
                        <div className="flex justify-between text-green-500">
                          <span>Savings (vs. monthly)</span>
                          <span>$29.89</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{selectedPlan === "monthly" ? "$9.99" : "$89.99"}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div>Billing period: {startDate} to {endDate}</div>
                      {selectedPlan === "monthly" ? (
                        <div>Your subscription will renew automatically every month.</div>
                      ) : (
                        <div>Your subscription will renew automatically every year.</div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={handleSubscribe}
                      disabled={isPaymentProcessing}
                    >
                      {isPaymentProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Subscribe Now</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                <div className="flex items-start text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                  <LifeBuoy className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <p>Need help? You can cancel your subscription at any time from your account settings. If you have any questions, please contact our support team.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Features Comparison</CardTitle>
                    <CardDescription>See what's included in each plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Feature</th>
                            <th className="text-center py-3 px-4">Free Trial</th>
                            <th className="text-center py-3 px-4">Premium</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-3 px-4">Journal Entries</td>
                            <td className="text-center py-3 px-4">Limited (10)</td>
                            <td className="text-center py-3 px-4">Unlimited</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Mood Tracking</td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Basic Analytics</td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Advanced Analytics</td>
                            <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Wellness Activities</td>
                            <td className="text-center py-3 px-4">Basic (2)</td>
                            <td className="text-center py-3 px-4">All Activities</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Writing Prompts</td>
                            <td className="text-center py-3 px-4">Limited</td>
                            <td className="text-center py-3 px-4">Extended Library</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Data Export</td>
                            <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Priority Support</td>
                            <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                            <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
}