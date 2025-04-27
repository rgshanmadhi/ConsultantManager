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
          <Card className="hover-card gradient-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Shortcuts to key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/journal" className="col-span-1">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 animate-button" size="lg">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-xl">✏️</span>
                    </div>
                    <span className="text-sm">Journal</span>
                  </Button>
                </Link>
                <Link href="#calendar" className="col-span-1">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 animate-button" size="lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-xl">📅</span>
                    </div>
                    <span className="text-sm">Calendar</span>
                  </Button>
                </Link>
                <div className="col-span-1">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 animate-button" size="lg">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                    <span className="text-sm">Insights</span>
                  </Button>
                </div>
                <Link href="/subscription" className="col-span-1">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 animate-button" size="lg">
                    <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <span className="text-xl">⭐</span>
                    </div>
                    <span className="text-sm">Upgrade</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Mood and Journal Section */}
          <Card className="hover-card gradient-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl gradient-heading">Today's Check-in</CardTitle>
                  <CardDescription>How are you feeling today?</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white">
                  <span className="text-sm">🌟</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className={`mb-8 transition-all duration-500 ${selectedMood ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}`}>
                  <div className="max-w-xl mx-auto">
                    <div className="text-center mb-3">
                      <h3 className="text-base font-medium mb-2">Select your mood</h3>
                      <p className="text-sm text-muted-foreground">Tracking your mood helps identify patterns over time.</p>
                    </div>
                    <MoodTracker selectedMood={selectedMood} onMoodSelect={handleMoodSelect} />
                  </div>
                </div>
                
                {selectedMood && (
                  <div className="mt-8 journal-entry-appear">
                    <div className="px-4 py-3 bg-primary/5 rounded-lg mb-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                          <span className="text-xl">{selectedMood === "Happy" ? "😊" : 
                            selectedMood === "Neutral" ? "😐" : 
                            selectedMood === "Sad" ? "😔" : 
                            selectedMood === "Angry" ? "😠" : 
                            selectedMood === "Tired" ? "😴" : "❓"}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-medium">You're feeling {selectedMood}</h3>
                          <p className="text-xs text-muted-foreground">Express your thoughts below</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedMood(null)}
                        className="text-xs h-8"
                      >
                        Change
                      </Button>
                    </div>
                    <JournalEntry 
                      mood={selectedMood} 
                      onSave={handleSaveEntry} 
                      isSubmitting={isSubmitting}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-card gradient-card" id="calendar">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl gradient-heading">Insights</CardTitle>
                  <CardDescription>Visualize your mental wellness journey</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white opacity-80 hover:opacity-100 transition-opacity cursor-help" title="Track daily to see patterns">
                    <span className="text-xs">?</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calendar" className="sm:px-2">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="calendar" className="animate-button">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Calendar</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="animate-button">
                    <div className="flex items-center space-x-2">
                      <LineChart className="h-4 w-4" />
                      <span>Trends</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative min-h-[300px]">
                  <TabsContent value="calendar" className="tab-content-enter-active">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="loading-pulse">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground mt-2">Loading your calendar...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="chart-hover">
                        <CalendarView 
                          entries={entries} 
                          selectedDate={selectedDate}
                          onSelectDate={handleDateSelect}
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="trends" className="tab-content-enter-active">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="loading-pulse">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground mt-2">Analyzing your moods...</p>
                        </div>
                      </div>
                    ) : entries && entries.length > 0 ? (
                      <div className="chart-hover">
                        <MoodTrends entries={entries} />
                      </div>
                    ) : (
                      <div className="text-center py-20 px-4 border border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                        <div className="max-w-sm mx-auto space-y-4">
                          <p className="text-muted-foreground">Start tracking your mood to see trends and patterns over time</p>
                          <div className="flex justify-center gap-4 my-4">
                            <span className="text-xl opacity-40">😊</span>
                            <span className="text-xl opacity-60">😐</span>
                            <span className="text-xl opacity-40">😔</span>
                          </div>
                          <Button 
                            variant="outline" 
                            className="animate-button"
                            onClick={() => {
                              const element = document.querySelector('[role="tablist"] [value="calendar"]') as HTMLElement;
                              element?.click();
                            }}
                          >
                            View Calendar
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="hover-card animated-bg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl gradient-heading">
                Welcome, {user?.name || user?.username}!
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm">
                    Track your mood and journal your thoughts to improve your mental well-being.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Trial status: <span className="text-green-500 font-medium">Active</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold animate-pulse">
                  {(user?.name || user?.username || 'S').charAt(0).toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Recommendations */}
          <Card className="hover-card gradient-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                  <CardDescription>Activities based on your mood</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white">
                  <span className="text-sm">✨</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityRecommendations mood={selectedMood} />
              
              {!selectedMood && (
                <div className="py-4 text-center text-muted-foreground loading-pulse">
                  <p className="text-sm">Select a mood to see personalized recommendations</p>
                  <div className="flex justify-center gap-2 mt-3">
                    <span className="text-2xl">😊</span>
                    <span className="text-2xl">😐</span>
                    <span className="text-2xl">😔</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Past Entries */}
          <Card className="hover-card gradient-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Entries</CardTitle>
                  <CardDescription>Your mood journal history</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white">
                  <span className="text-sm">📝</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PastEntries 
                entries={entries}
                isLoading={isLoading}
                error={error as Error | null}
              />
              
              {entries && entries.length === 0 && !isLoading && !error && (
                <div className="py-4 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-muted-foreground">Start journaling to see your entries here</p>
                  <Link href="/journal">
                    <Button size="sm" variant="link" className="mt-2 animate-button">
                      Create your first entry
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}