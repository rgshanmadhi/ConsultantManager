import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Entry, InsertEntry, MoodType, SentimentType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

import MoodTracker from "@/components/MoodTracker";
import JournalEntry from "@/components/JournalEntry";
import ActivityRecommendations from "@/components/ActivityRecommendations";
import CalendarView from "@/components/CalendarView";
import MoodTrends from "@/components/MoodTrends";
import PastEntries from "@/components/PastEntries";
import { Loader2, Calendar, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch all entries
  const { 
    data: entries = [], 
    isLoading, 
    error 
  } = useQuery<Entry[]>({
    queryKey: ['/api/entries'],
    retry: 1
  });
  
  // Create entry mutation
  const { mutate: createEntry, isPending: isSubmitting } = useMutation({
    mutationFn: async (entry: InsertEntry) => {
      const response = await apiRequest("POST", "/api/entries", {
        ...entry,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate entries query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      
      // Show success toast
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully.",
      });
      
      // Reset selected mood
      setSelectedMood(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to save entry",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };
  
  const handleSaveEntry = async (journalText: string, sentiment: SentimentType) => {
    if (!selectedMood) {
      toast({
        title: "Mood required",
        description: "Please select your mood before saving your journal entry.",
        variant: "destructive",
      });
      return;
    }
    
    const newEntry: InsertEntry = {
      mood: selectedMood,
      journalEntry: journalText,
      sentiment,
      date: new Date(),
      userId: user?.id,
    };
    
    createEntry(newEntry);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle subscription status
  const isSubscriptionRequired = error && 
    (error instanceof Error && (error.message === "Subscription required" || error.message.includes("402")));
  
  if (isSubscriptionRequired) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center gradient-heading">Subscription Required</CardTitle>
            <CardDescription className="text-center">
              Your trial period has ended or you need to subscribe to access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <p className="text-center max-w-lg mx-auto">
              To continue tracking your mental health journey and accessing all features of Serene, 
              please subscribe to our premium plan.
            </p>
            <Link href="/subscription">
              <Button className="w-full md:w-auto">
                Subscribe Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2 gradient-heading">Serene Dashboard</h1>
      <p className="text-center text-muted-foreground mb-10">
        Track your mood, journal your thoughts, and improve your well-being
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Quick Actions Card */}
          <Card className="hover-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/journal">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">✏️</span>
                      <span>Journal Entry</span>
                    </div>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">📊</span>
                    <span>Export Data</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Mood and Journal Section */}
          <Card className="hover-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Today's Check-in</CardTitle>
              <CardDescription>How are you feeling today?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <MoodTracker selectedMood={selectedMood} onMoodSelect={handleMoodSelect} />
              </div>
              
              {selectedMood && (
                <div className="mt-8 journal-entry-appear">
                  <h3 className="text-lg font-medium mb-3">Express your thoughts</h3>
                  <JournalEntry 
                    mood={selectedMood} 
                    onSave={handleSaveEntry} 
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Insights</CardTitle>
              <CardDescription>Visualize your mental wellness journey</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calendar">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="calendar">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Calendar</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="trends">
                    <div className="flex items-center space-x-2">
                      <LineChart className="h-4 w-4" />
                      <span>Trends</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="calendar">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <CalendarView 
                      entries={entries} 
                      selectedDate={selectedDate}
                      onSelectDate={handleDateSelect}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="trends">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : entries && entries.length > 0 ? (
                    <MoodTrends entries={entries} />
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p>Start tracking your mood to see trends over time</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="hover-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader>
              <CardTitle>Welcome, {user?.name || user?.username}!</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Track your mood and journal your thoughts to improve your mental well-being.
              </p>
            </CardContent>
          </Card>
          
          {/* Activity Recommendations */}
          <Card className="hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recommendations</CardTitle>
              <CardDescription>Activities based on your mood</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityRecommendations mood={selectedMood} />
            </CardContent>
          </Card>
          
          {/* Past Entries */}
          <Card className="hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Entries</CardTitle>
              <CardDescription>Your recent mood journal entries</CardDescription>
            </CardHeader>
            <CardContent>
              <PastEntries 
                entries={entries}
                isLoading={isLoading}
                error={error as Error | null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}