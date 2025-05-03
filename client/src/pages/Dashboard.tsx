import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  Smile,
  Frown,
  Meh,
  Angry,
  LineChart,
  Clock,
  Activity,
  Loader2,
} from "lucide-react";
import { activitiesMapping, MoodType } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Placeholder for when we don't have entries yet
const placeholderMoodDistribution = {
  Happy: 0,
  Neutral: 0,
  Sad: 0,
  Angry: 0,
  Tired: 0,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("week");
  
  // Fetch entries from API
  const { data: entries, isLoading } = useQuery({
    queryKey: ["/api/entries"],
    enabled: !!user,
  });
  
  // Activity recommendations based on current mood
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  
  // Calculate stats from entries
  const getStats = () => {
    if (!entries || entries.length === 0) {
      return {
        total: 0,
        moodDistribution: placeholderMoodDistribution,
        recentEntries: [],
        mostCommonMood: null,
      };
    }
    
    // Get date range based on timeframe
    let startDate: Date;
    const today = new Date();
    
    switch (timeframe) {
      case "week":
        startDate = subDays(today, 7);
        break;
      case "month":
        startDate = startOfMonth(today);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = subDays(today, 7);
    }
    
    // Filter entries by timeframe
    const timeframeEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= today;
    });
    
    // Count mood occurrences
    const moodCounts = { ...placeholderMoodDistribution };
    timeframeEntries.forEach((entry) => {
      moodCounts[entry.mood as MoodType] = (moodCounts[entry.mood as MoodType] || 0) + 1;
    });
    
    // Find most common mood
    let mostCommonMood: MoodType | null = null;
    let maxCount = 0;
    
    (Object.keys(moodCounts) as MoodType[]).forEach((mood) => {
      if (moodCounts[mood] > maxCount) {
        maxCount = moodCounts[mood];
        mostCommonMood = mood;
      }
    });
    
    // Get 5 most recent entries
    const recentEntries = [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    return {
      total: timeframeEntries.length,
      moodDistribution: moodCounts,
      recentEntries,
      mostCommonMood,
    };
  };
  
  const stats = getStats();
  
  // Get color for mood
  const getMoodColor = (mood: MoodType) => {
    switch (mood) {
      case "Happy":
        return "bg-green-500 text-green-50";
      case "Neutral":
        return "bg-blue-500 text-blue-50";
      case "Sad":
        return "bg-purple-500 text-purple-50";
      case "Angry":
        return "bg-red-500 text-red-50";
      case "Tired":
        return "bg-amber-500 text-amber-50";
      default:
        return "bg-gray-500 text-gray-50";
    }
  };
  
  // Get emoji for mood
  const getMoodEmoji = (mood: MoodType) => {
    switch (mood) {
      case "Happy":
        return <Smile className="h-5 w-5" />;
      case "Neutral":
        return <Meh className="h-5 w-5" />;
      case "Sad":
        return <Frown className="h-5 w-5" />;
      case "Angry":
        return <Angry className="h-5 w-5" />;
      case "Tired":
        return <Clock className="h-5 w-5" />;
      default:
        return <Meh className="h-5 w-5" />;
    }
  };
  
  // Truncate journal entry for preview
  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  // When user selects a mood, show activity recommendations
  const handleMoodSelect = (mood: MoodType) => {
    setCurrentMood(mood);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name || user?.username}</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as "week" | "month" | "year")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">in selected timeframe</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Most Common Mood</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.mostCommonMood ? (
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getMoodColor(stats.mostCommonMood).split(' ')[0]}`}></div>
                  <div className="text-2xl font-bold">{stats.mostCommonMood}</div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">No data</div>
              )}
              <p className="text-xs text-muted-foreground">based on your entries</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mood Distribution</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 pt-1">
                {Object.entries(stats.moodDistribution).map(([mood, count]) => (
                  <div
                    key={mood}
                    className="h-10 flex-1 rounded-md tooltip"
                    style={{
                      backgroundColor: getMoodColor(mood as MoodType).split(' ')[0],
                      opacity: count > 0 ? 1 : 0.3,
                    }}
                    title={`${mood}: ${count}`}
                  ></div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">mood breakdown</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Next Journal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today</div>
              <p className="text-xs text-muted-foreground">keep your journal updated</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for Journal and Recommendations */}
        <Tabs defaultValue="journal" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="journal">Recent Journal Entries</TabsTrigger>
            <TabsTrigger value="recommendations">Mood & Activities</TabsTrigger>
          </TabsList>
          
          {/* Recent Journal Entries */}
          <TabsContent value="journal" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Entries</h3>
              <Button asChild variant="outline" size="sm">
                <Link href="/journal">View All Entries</Link>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stats.recentEntries.length > 0 ? (
              <div className="space-y-4">
                {stats.recentEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getMoodColor(entry.mood as MoodType)}`}>
                            {getMoodEmoji(entry.mood as MoodType)}
                          </div>
                          <CardTitle className="text-base font-medium">{entry.mood}</CardTitle>
                        </div>
                        <CardDescription>{formatDate(entry.date)}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{truncateText(entry.journalEntry)}</p>
                      {entry.sentiment && (
                        <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-flex items-center ${
                          entry.sentiment === "Positive" 
                            ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300" 
                            : entry.sentiment === "Negative"
                            ? "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300"
                        }`}>
                          Sentiment: {entry.sentiment}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>You haven't created any journal entries yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/journal">Create Your First Entry</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Mood & Activity Recommendations */}
          <TabsContent value="recommendations" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">How are you feeling today?</h3>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(activitiesMapping) as MoodType[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                      currentMood === mood 
                        ? `${getMoodColor(mood)} ring-2 ring-offset-2` 
                        : "bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="text-2xl">
                      {mood === "Happy" && "😊"}
                      {mood === "Neutral" && "😐"}
                      {mood === "Sad" && "😢"}
                      {mood === "Angry" && "😠"}
                      {mood === "Tired" && "😴"}
                    </div>
                    <span className={currentMood === mood ? "font-medium" : ""}>
                      {mood}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {currentMood && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Activities for {currentMood} Mood</CardTitle>
                  <CardDescription>
                    Try these activities to support your wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {activitiesMapping[currentMood].map((activity, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5">
                          <span className="text-primary text-xs">{index + 1}</span>
                        </div>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between">
              <Button asChild variant="outline">
                <Link href="/journal">Create Journal Entry</Link>
              </Button>
              <Button asChild>
                <Link href="/games">Try Wellness Activities</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}