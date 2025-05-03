import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Entry, InsertEntry, activitiesMapping } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Schema for journal entry form
const entrySchema = z.object({
  mood: z.enum(["Happy", "Neutral", "Sad", "Angry", "Tired"]),
  journalEntry: z.string().min(1, "Journal entry is required"),
});

type JournalEntry = z.infer<typeof entrySchema>;

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sentimentAnalysis, setSentimentAnalysis] = useState<string | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [moodDescription, setMoodDescription] = useState<string>("");
  
  // Fetch entries
  const { data: entries, isLoading: entriesLoading } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
    enabled: !!user,
  });
  
  // Create new entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertEntry) => {
      const res = await apiRequest("POST", "/api/entries", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      reset();
      setSentimentAnalysis(null);
    },
    onError: (error) => {
      toast({
        title: "Error saving entry",
        description: error.message || "There was a problem saving your entry.",
        variant: "destructive",
      });
    },
  });
  
  // Form setup
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<JournalEntry>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      mood: "Neutral",
      journalEntry: "",
    },
  });
  
  // Watch journal entry for sentiment analysis
  const journalEntry = watch("journalEntry");
  const mood = watch("mood");
  
  // Debounced sentiment analysis
  const analyzeSentiment = async (text: string) => {
    if (text.length < 10) return;
    
    try {
      setSentimentLoading(true);
      const res = await apiRequest("GET", `/api/analyze-sentiment?text=${encodeURIComponent(text)}`);
      const data = await res.json();
      setSentimentAnalysis(data.sentiment);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
    } finally {
      setSentimentLoading(false);
    }
  };
  
  // Handle journal entry change with debounce
  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("journalEntry", e.target.value);
    
    // Debounce sentiment analysis
    if (sentimentAnalysisTimeout) {
      clearTimeout(sentimentAnalysisTimeout);
    }
    
    // Only analyze if text is long enough
    if (e.target.value.length >= 10) {
      sentimentAnalysisTimeout = setTimeout(() => {
        analyzeSentiment(e.target.value);
      }, 800);
    }
  };
  
  let sentimentAnalysisTimeout: NodeJS.Timeout;
  
  // Handle form submission
  const onSubmit = async (data: JournalEntry) => {
    createEntryMutation.mutate({
      ...data,
      userId: user!.id,
      sentiment: sentimentAnalysis || undefined, // Use analyzed sentiment if available
    });
  };
  
  // Get entries for selected date
  const entriesForDate = entries?.filter(entry => {
    const entryDate = new Date(entry.date);
    return isSameDay(entryDate, selectedDate);
  }) || [];
  
  // Generate calendar days for current month
  const calendarDays = (() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  })();
  
  // Check if a day has entries
  const dayHasEntries = (day: Date) => {
    return entries?.some(entry => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, day);
    });
  };
  
  // Update mood description based on selected mood
  const updateMoodDescription = (mood: string) => {
    switch(mood) {
      case "Happy":
        setMoodDescription("You're feeling positive and content.");
        break;
      case "Neutral":
        setMoodDescription("You're feeling balanced and calm.");
        break;
      case "Sad":
        setMoodDescription("You're feeling down or melancholic.");
        break;
      case "Angry":
        setMoodDescription("You're feeling frustrated or irritated.");
        break;
      case "Tired":
        setMoodDescription("You're feeling low energy or fatigued.");
        break;
      default:
        setMoodDescription("");
    }
  };
  
  // Get color for mood
  const getMoodColor = (mood: string) => {
    switch(mood) {
      case "Happy": return "#4ade80";
      case "Neutral": return "#94a3b8";
      case "Sad": return "#60a5fa";
      case "Angry": return "#f87171";
      case "Tired": return "#c084fc";
      default: return "#94a3b8";
    }
  };
  
  // Get emoji for mood
  const getMoodEmoji = (mood: string) => {
    switch(mood) {
      case "Happy": return "😊";
      case "Neutral": return "😐";
      case "Sad": return "😢";
      case "Angry": return "😠";
      case "Tired": return "😴";
      default: return "";
    }
  };
  
  // Get activities based on mood
  const getMoodActivities = (mood: string) => {
    if (Object.prototype.hasOwnProperty.call(activitiesMapping, mood)) {
      return activitiesMapping[mood as keyof typeof activitiesMapping];
    }
    return [];
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Journal</h1>
            <p className="text-muted-foreground">Record your thoughts and track your mood</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, "MMMM yyyy")}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 lg:grid-cols-3 gap-6">
          {/* Calendar (shown on larger screens) */}
          <Card className="md:col-span-3 lg:col-span-1 order-2 md:order-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view or add entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const hasEntries = dayHasEntries(day);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      className={`h-10 w-full rounded-md flex items-center justify-center text-sm transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : hasEntries
                          ? "bg-primary/10 hover:bg-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            </CardFooter>
          </Card>

          {/* Journal Form */}
          <Card className="md:col-span-4 lg:col-span-2 order-1 md:order-2">
            <CardHeader>
              <CardTitle>New Entry</CardTitle>
              <CardDescription>
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                id="journalForm" 
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="mood">How are you feeling today?</Label>
                  <Select
                    defaultValue="Neutral"
                    onValueChange={(value) => {
                      setValue("mood", value as any);
                      updateMoodDescription(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Happy">😊 Happy</SelectItem>
                      <SelectItem value="Neutral">😐 Neutral</SelectItem>
                      <SelectItem value="Sad">😢 Sad</SelectItem>
                      <SelectItem value="Angry">😠 Angry</SelectItem>
                      <SelectItem value="Tired">😴 Tired</SelectItem>
                    </SelectContent>
                  </Select>
                  {moodDescription && (
                    <p className="text-sm text-muted-foreground">{moodDescription}</p>
                  )}
                  {errors.mood?.message && (
                    <p className="text-sm text-destructive">{errors.mood.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="journalEntry">Write your thoughts</Label>
                    {sentimentLoading ? (
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Analyzing...
                      </span>
                    ) : sentimentAnalysis ? (
                      <span className={`text-sm font-medium ${
                        sentimentAnalysis === "Positive" 
                          ? "text-green-600" 
                          : sentimentAnalysis === "Negative"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}>
                        {sentimentAnalysis} sentiment
                      </span>
                    ) : null}
                  </div>
                  <Textarea
                    id="journalEntry"
                    placeholder="What's on your mind today?"
                    rows={8}
                    {...register("journalEntry")}
                    onChange={handleJournalChange}
                  />
                  {errors.journalEntry?.message && (
                    <p className="text-sm text-destructive">{errors.journalEntry.message}</p>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  setSentimentAnalysis(null);
                }}
              >
                Clear
              </Button>
              <Button 
                type="submit" 
                form="journalForm"
                disabled={createEntryMutation.isPending}
              >
                {createEntryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Previous Entries for Selected Date */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Entries for {format(selectedDate, "MMMM d, yyyy")}
          </h2>
          
          {entriesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : entriesForDate.length > 0 ? (
            <div className="space-y-4">
              {entriesForDate.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${getMoodColor(entry.mood)}30`, color: getMoodColor(entry.mood) }}
                        >
                          {getMoodEmoji(entry.mood)}
                        </div>
                        <div>
                          <CardTitle>{entry.mood}</CardTitle>
                          <CardDescription>
                            {format(new Date(entry.date), "h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                      {entry.sentiment && (
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${
                              entry.sentiment === "Positive" 
                                ? "#4ade8030" 
                                : entry.sentiment === "Negative"
                                ? "#f8717130"
                                : "#94a3b830"
                            }`,
                            color: entry.sentiment === "Positive" 
                              ? "#16a34a" 
                              : entry.sentiment === "Negative"
                              ? "#dc2626"
                              : "#64748b"
                          }}
                        >
                          {entry.sentiment}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{entry.journalEntry}</p>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full">
                      <h4 className="font-medium text-sm mb-2">Recommended Activities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {getMoodActivities(entry.mood).map((activity, index) => (
                          <div 
                            key={index}
                            className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                          >
                            {activity}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Entries Yet</CardTitle>
                <CardDescription>
                  You don't have any journal entries for this date.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
      
      {/* Entry Detail Dialog */}
      <AlertDialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center space-x-2">
                {selectedEntry && (
                  <>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${getMoodColor(selectedEntry.mood)}30`, color: getMoodColor(selectedEntry.mood) }}
                    >
                      {getMoodEmoji(selectedEntry.mood)}
                    </div>
                    <span>{selectedEntry.mood}</span>
                  </>
                )}
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedEntry && format(new Date(selectedEntry.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedEntry && (
            <div className="py-4">
              <p className="whitespace-pre-wrap mb-6">{selectedEntry.journalEntry}</p>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Recommended Activities:</h4>
                <div className="flex flex-wrap gap-2">
                  {getMoodActivities(selectedEntry.mood).map((activity, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full"
                    >
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedEntry.sentiment && (
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">Sentiment Analysis:</span>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${
                        selectedEntry.sentiment === "Positive" 
                          ? "#4ade8030" 
                          : selectedEntry.sentiment === "Negative"
                          ? "#f8717130"
                          : "#94a3b830"
                      }`,
                      color: selectedEntry.sentiment === "Positive" 
                        ? "#16a34a" 
                        : selectedEntry.sentiment === "Negative"
                        ? "#dc2626"
                        : "#64748b"
                    }}
                  >
                    {selectedEntry.sentiment}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}