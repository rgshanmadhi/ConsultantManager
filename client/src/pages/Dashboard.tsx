import { useQuery } from "@tanstack/react-query";
import { Entry } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  BookIcon,
  HeartPulseIcon,
  PlusIcon,
  BarChart3Icon,
  CalendarIcon,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: entries, isLoading: entriesLoading } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
    enabled: !!user,
  });
  
  // Get mood counts for the statistics
  const moodCounts = entries?.reduce((acc: Record<string, number>, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {}) || {};
  
  const mostFrequentMood = entries && entries.length > 0
    ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;
    
  // Determine mood color class
  const getMoodColorClass = (mood: string) => {
    switch (mood) {
      case 'Happy': return 'bg-green-500';
      case 'Neutral': return 'bg-blue-500';
      case 'Sad': return 'bg-blue-600';
      case 'Angry': return 'bg-red-500';
      case 'Tired': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Determine emoji for mood
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'Happy': return '😊';
      case 'Neutral': return '😐';
      case 'Sad': return '😢';
      case 'Angry': return '😠';
      case 'Tired': return '😴';
      default: return '';
    }
  };
  
  // Get entries from recent days
  const recentEntries = entries?.slice(0, 3) || [];
  
  // Calculate days in current streak (simplified version)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const hasEntryToday = entries?.some(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  const hasEntryYesterday = entries?.some(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === yesterday.getTime();
  });
  
  let currentStreak = 0;
  if (hasEntryToday) {
    currentStreak = 1;
    if (hasEntryYesterday) {
      currentStreak = 2;
      // For a more accurate streak, we would need to check more days
    }
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hello, {user?.name || user?.username}
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasEntryToday 
                ? 'You\'ve already recorded your mood today. Great job!' 
                : 'How are you feeling today?'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/journal">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Entry
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <div className="text-3xl font-bold">
                  {entries?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <div className="text-3xl font-bold">
                  {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Frequent Mood</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : mostFrequentMood ? (
                <div className="flex items-center space-x-2">
                  <div 
                    className={`h-8 w-8 rounded-full text-xl flex items-center justify-center ${getMoodColorClass(mostFrequentMood)}`}
                  >
                    {getMoodEmoji(mostFrequentMood)}
                  </div>
                  <span className="text-2xl font-bold">{mostFrequentMood}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">No entries yet</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.isSubscribed ? 'Subscription' : user?.isInTrial ? 'Trial Period' : 'Trial Expired'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user?.isSubscribed ? (
                <div className="text-green-600 font-medium">Active</div>
              ) : user?.isInTrial ? (
                <div className="text-amber-600 font-medium">
                  {user?.trialEndDate ? (
                    <>{format(new Date(user.trialEndDate), "MMM d, yyyy")}</>
                  ) : (
                    <>Active</>
                  )}
                </div>
              ) : (
                <div className="text-red-600 font-medium">Expired</div>
              )}
              {!user?.isSubscribed && (
                <Link href="/subscription" className="text-sm text-primary hover:underline block mt-1">
                  {user?.isInTrial ? 'Upgrade now' : 'Subscribe now'}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Shortcuts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
            <Link href="/journal">
              <CardHeader>
                <BookIcon className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2">Journal</CardTitle>
                <CardDescription>Record your thoughts and track your mood</CardDescription>
              </CardHeader>
            </Link>
          </Card>
          
          <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
            <Link href="/games">
              <CardHeader>
                <HeartPulseIcon className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2">Wellness Activities</CardTitle>
                <CardDescription>Engage with activities to improve your mood</CardDescription>
              </CardHeader>
            </Link>
          </Card>
          
          <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
            <Link href="/insights">
              <CardHeader>
                <BarChart3Icon className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2">Insights</CardTitle>
                <CardDescription>Analyze your mood patterns and trends</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
        
        {/* Recent Entries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Entries</h2>
            {entries && entries.length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/journal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
            )}
          </div>
          
          {entriesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`h-8 w-8 rounded-full text-xl flex items-center justify-center ${getMoodColorClass(entry.mood)}`}
                        >
                          {getMoodEmoji(entry.mood)}
                        </div>
                        <CardTitle>{entry.mood}</CardTitle>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.date), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2">{entry.journalEntry}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Entries Yet</CardTitle>
                <CardDescription>
                  Start journaling to see your entries here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/journal">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create your first entry
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}