import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, PenLine, Calendar, Clock, History } from "lucide-react";
import { MoodType, SentimentType, Entry } from "@shared/schema";
import MoodTracker from "@/components/MoodTracker";
import JournalEntry from "@/components/JournalEntry";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, getMoodEmoji, getSentimentIcon } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journalTab, setJournalTab] = useState<"write" | "history">("write");

  // Fetch all entries
  const { 
    data: entries = [], 
    isLoading: entriesLoading 
  } = useQuery<Entry[]>({
    queryKey: ['/api/entries'],
    retry: 1
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async ({ mood, journalText, sentiment }: { 
      mood: MoodType; 
      journalText: string; 
      sentiment: SentimentType 
    }) => {
      const res = await apiRequest("POST", "/api/entries", {
        mood,
        journalEntry: journalText,
        sentiment,
        date: new Date(),
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully",
        className: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      });
      // Reset form
      setSelectedMood(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save entry",
        description: error.message || "Could not save your journal entry",
        variant: "destructive",
      });
    },
  });

  // Show writing interface automatically if no entries exist
  useEffect(() => {
    if (entries && entries.length === 0 && !entriesLoading) {
      setJournalTab("write");
    }
  }, [entries, entriesLoading]);

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };

  const handleSaveEntry = async (journalText: string, sentiment: SentimentType) => {
    if (!selectedMood) {
      toast({
        title: "Mood required",
        description: "Please select your mood before saving",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      mood: selectedMood,
      journalText,
      sentiment
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group entries by date
  const entriesByDate = entries.reduce((groups, entry) => {
    const date = format(new Date(entry.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, Entry[]>);

  // Sort entries by date (newest first)
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex items-center mb-2 md:mb-0">
            <Button 
              variant="ghost" 
              className="mr-2 p-2" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-3xl font-bold gradient-heading">Journal</h1>
          </div>
          
          <div className="w-auto">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger 
                value="write" 
                className="flex items-center gap-1"
                onClick={() => setJournalTab("write")}
                data-state={journalTab === "write" ? "active" : ""}
              >
                <PenLine size={16} />
                <span>Write</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-1"
                onClick={() => setJournalTab("history")}
                data-state={journalTab === "history" ? "active" : ""}
              >
                <History size={16} />
                <span>History</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {journalTab === "write" ? (
          <div className="mt-4 space-y-6">
            {/* Mood Tracker */}
            <Card className="hover-card gradient-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">How are you feeling today?</CardTitle>
                    <CardDescription>Select your current mood to help track patterns over time</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white">
                    <span className="text-sm">🌈</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MoodTracker 
                  selectedMood={selectedMood} 
                  onMoodSelect={handleMoodSelect} 
                />
              </CardContent>
            </Card>
            
            {/* Journal Entry */}
            <div>
              <JournalEntry 
                mood={selectedMood} 
                onSave={handleSaveEntry}
                isSubmitting={createEntryMutation.isPending}
              />
            </div>
            
            {/* Quick Tips */}
            <Card className="bg-muted/50 border-dashed border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Journal Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Write freely without judgment</li>
                  <li>Try to journal at the same time each day</li>
                  <li>Include both challenges and positive moments</li>
                  <li>Use writing prompts when you're not sure what to write about</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Journal History</CardTitle>
                  <CardDescription>Review your past entries and reflections</CardDescription>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setJournalTab("write")}
                  className="hidden sm:flex items-center gap-1"
                >
                  <PenLine size={16} />
                  <span>New Entry</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="loading-pulse text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading your journal entries...</p>
                  </div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start journaling to track your moods and thoughts over time.
                    </p>
                    <Button onClick={() => setJournalTab("write")} className="animate-button">
                      Create Your First Entry
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-8">
                    {sortedDates.map(dateStr => (
                      <div key={dateStr} className="pb-4">
                        <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10 mb-3 flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <time dateTime={dateStr} className="text-sm font-medium">
                            {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                          </time>
                        </div>
                        
                        <div className="space-y-4">
                          {entriesByDate[dateStr].map(entry => (
                            <Card key={entry.id} className="hover-card overflow-hidden">
                              <CardHeader className="pb-2 bg-muted/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1 rounded-full" title={entry.mood}>
                                      <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                                    </div>
                                    <div>
                                      <div className="font-medium">{entry.mood}</div>
                                      <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="mr-1 h-3 w-3" />
                                        <time dateTime={entry.date.toString()}>
                                          {format(new Date(entry.date), 'h:mm a')}
                                        </time>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <div className="bg-muted px-2 py-0.5 rounded-full text-xs flex items-center gap-1" title="Sentiment">
                                      <span className="text-xs">{getSentimentIcon(entry.sentiment || "Neutral")}</span>
                                      <span>{entry.sentiment || "Neutral"}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-4 pb-3">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <p className="whitespace-pre-line">{entry.journalEntry}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
