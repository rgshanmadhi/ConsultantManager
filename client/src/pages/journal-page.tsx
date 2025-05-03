import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertEntrySchema, MoodType } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parse, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Smile,
  Frown,
  Meh,
  Angry,
  Clock,
  Loader2,
  Lightbulb,
  PanelTop,
  PanelBottom,
  Trash2,
  SunMoon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Journal entry schema with validation
const entrySchema = insertEntrySchema.extend({
  mood: z.enum(["Happy", "Neutral", "Sad", "Angry", "Tired"]),
  journalEntry: z.string().min(1, "Please enter your journal entry")
});

type EntryFormValues = z.infer<typeof entrySchema>;

// Writing prompts based on mood
const moodPrompts: Record<MoodType, string[]> = {
  Happy: [
    "What made you happy today? Describe it in detail.",
    "Who or what contributed to your happiness?",
    "How can you continue or recreate this positive feeling?",
    "What are you grateful for in this moment?",
    "How did your happiness affect others around you?"
  ],
  Neutral: [
    "Describe your day. What stands out?",
    "Is there anything you're looking forward to?",
    "What's one thing you could do to improve your mood?",
    "Are there any decisions you're contemplating?",
    "What activities did you engage in today?"
  ],
  Sad: [
    "What's contributing to your sadness today?",
    "When did you start feeling this way?",
    "What has helped you feel better in the past?",
    "Is there someone you could reach out to for support?",
    "What's one small thing you could do for yourself right now?"
  ],
  Angry: [
    "What triggered your anger today?",
    "How did you respond to this feeling?",
    "What would a calmer response have looked like?",
    "Is this situation within your control?",
    "What boundaries might need to be set or reinforced?"
  ],
  Tired: [
    "What's draining your energy right now?",
    "How has your sleep been lately?",
    "What would help you feel more rested?",
    "Are there any tasks you can postpone?",
    "What restores your energy when you're feeling depleted?"
  ]
};

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Fetch entries from API
  const { data: entries, isLoading } = useQuery({
    queryKey: ["/api/entries"],
    enabled: !!user,
  });
  
  // Filter entries by selected date
  const selectedDateEntries = entries?.filter(entry => {
    const entryDate = new Date(entry.date);
    if (!selectedDate) return false;
    
    return (
      entryDate.getDate() === selectedDate.getDate() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getFullYear() === selectedDate.getFullYear()
    );
  }) || [];
  
  // Journal entry form
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      mood: "Neutral",
      journalEntry: "",
    }
  });
  
  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      const res = await apiRequest("POST", "/api/entries", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry created",
        description: "Your journal entry has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      // Reset form and close sheet
      form.reset();
      setShowEntrySheet(false);
      setCurrentPrompt(null);
    },
    onError: (error) => {
      toast({
        title: "Error creating entry",
        description: error.message || "There was a problem saving your entry.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: EntryFormValues) => {
    // Add selected date to values
    createEntryMutation.mutate({
      ...values,
      date: selectedDate?.toISOString() || new Date().toISOString(),
      userId: user?.id
    });
  };
  
  // Get a random writing prompt for current mood
  const getRandomPrompt = (mood: MoodType) => {
    const prompts = moodPrompts[mood];
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
  };
  
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
  
  // Group entries by date for list view
  const groupEntriesByDate = () => {
    if (!entries) return {};
    
    const grouped: Record<string, typeof entries> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(entry);
    });
    
    return grouped;
  };
  
  // Get date label for grouped entries
  const getDateLabel = (dateString: string) => {
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE'); // Day name
    } else if (isThisMonth(date)) {
      return format(date, 'MMMM d'); // Month and day
    } else {
      return format(date, 'MMMM d, yyyy'); // Full date
    }
  };
  
  // Calculate sentiment stats
  const getSentimentStats = () => {
    if (!entries || entries.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }
    
    const stats = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    entries.forEach(entry => {
      if (entry.sentiment === "Positive") stats.positive++;
      else if (entry.sentiment === "Negative") stats.negative++;
      else stats.neutral++;
    });
    
    return stats;
  };
  
  const sentimentStats = getSentimentStats();
  const totalSentiments = sentimentStats.positive + sentimentStats.neutral + sentimentStats.negative;
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Journal</h1>
            <p className="text-muted-foreground">
              Record your thoughts, feelings, and experiences
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
            >
              {viewMode === "list" ? (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Calendar View
                </>
              ) : (
                <>
                  <PanelTop className="mr-2 h-4 w-4" />
                  List View
                </>
              )}
            </Button>
            
            <Button 
              className="w-full sm:w-auto"
              onClick={() => {
                setSelectedDate(new Date());
                setShowEntrySheet(true);
              }}
            >
              Create Entry
            </Button>
          </div>
        </div>
        
        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-7">
                <div className="md:col-span-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entries Calendar</CardTitle>
                      <CardDescription>
                        View your journal entries by date
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border mx-auto"
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
                      </CardTitle>
                      <CardDescription>
                        {selectedDateEntries.length} entries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedDateEntries.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDateEntries.map(entry => (
                            <div key={entry.id} className="border rounded-md p-3">
                              <div className="flex items-center mb-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${getMoodColor(entry.mood as MoodType)}`}>
                                  {getMoodEmoji(entry.mood as MoodType)}
                                </div>
                                <span className="font-medium">{entry.mood}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {format(new Date(entry.date), 'h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm">{entry.journalEntry.substring(0, 100)}
                                {entry.journalEntry.length > 100 && '...'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <PanelBottom className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No entries for this date</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => setShowEntrySheet(true)}
                          >
                            Create Entry
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mood Analysis</CardTitle>
                  <CardDescription>
                    Insights from your journal entries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sentiment Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Positive</span>
                        <span>{totalSentiments > 0 ? Math.round((sentimentStats.positive / totalSentiments) * 100) : 0}%</span>
                      </div>
                      <Progress
                        value={totalSentiments > 0 ? (sentimentStats.positive / totalSentiments) * 100 : 0}
                        className="h-2 bg-muted"
                      />
                      
                      <div className="flex justify-between text-sm">
                        <span>Neutral</span>
                        <span>{totalSentiments > 0 ? Math.round((sentimentStats.neutral / totalSentiments) * 100) : 0}%</span>
                      </div>
                      <Progress
                        value={totalSentiments > 0 ? (sentimentStats.neutral / totalSentiments) * 100 : 0}
                        className="h-2 bg-muted"
                      />
                      
                      <div className="flex justify-between text-sm">
                        <span>Negative</span>
                        <span>{totalSentiments > 0 ? Math.round((sentimentStats.negative / totalSentiments) * 100) : 0}%</span>
                      </div>
                      <Progress
                        value={totalSentiments > 0 ? (sentimentStats.negative / totalSentiments) * 100 : 0}
                        className="h-2 bg-muted"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Journal Consistency</h4>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-muted rounded-sm"
                          style={{
                            opacity: Math.random() > 0.65 ? 1 : 0.3,
                            backgroundColor: Math.random() > 0.65 ? 'var(--primary)' : undefined
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Last 28 days</p>
                  </div>
                  
                  <div className="flex items-center p-4 bg-muted/40 rounded-lg border border-dashed">
                    <Lightbulb className="h-8 w-8 text-primary mr-4" />
                    <div>
                      <h4 className="font-medium">Insight</h4>
                      <p className="text-sm text-muted-foreground">
                        Journaling regularly can help you identify patterns in your mood and thoughts.
                        Aim for at least 3 entries per week for the best results.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : entries && entries.length > 0 ? (
              Object.entries(groupEntriesByDate())
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([dateString, dateEntries]) => (
                  <div key={dateString} className="space-y-3">
                    <h3 className="text-lg font-medium sticky top-0 pt-2 pb-1 bg-background">
                      {getDateLabel(dateString)}
                    </h3>
                    <div className="space-y-3">
                      {dateEntries.map(entry => (
                        <Card key={entry.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getMoodColor(entry.mood as MoodType)}`}>
                                  {getMoodEmoji(entry.mood as MoodType)}
                                </div>
                                <CardTitle className="text-base font-medium">{entry.mood}</CardTitle>
                              </div>
                              <CardDescription>{format(new Date(entry.date), 'h:mm a')}</CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-wrap">{entry.journalEntry}</p>
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
                  </div>
                ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Journal Entries</h3>
                  <p className="text-muted-foreground mb-6">
                    Start recording your thoughts and feelings by creating your first journal entry.
                  </p>
                  <Button 
                    onClick={() => {
                      setSelectedDate(new Date());
                      setShowEntrySheet(true);
                    }}
                  >
                    Create Your First Entry
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      
      {/* New entry sheet */}
      <Sheet open={showEntrySheet} onOpenChange={setShowEntrySheet}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Journal Entry</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date selector */}
                <div className="space-y-2">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Mood selector */}
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How are you feeling?</FormLabel>
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        {(Object.keys(moodPrompts) as MoodType[]).map((mood) => (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => {
                              field.onChange(mood);
                              if (form.getValues().journalEntry === "") {
                                getRandomPrompt(mood);
                              }
                            }}
                            className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                              field.value === mood 
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
                            <span className={field.value === mood ? "font-medium" : ""}>
                              {mood}
                            </span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Writing prompt */}
                {currentPrompt && (
                  <div className="flex items-center p-4 bg-muted/40 rounded-lg border border-dashed">
                    <Lightbulb className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      <p>{currentPrompt}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto flex-shrink-0"
                      onClick={() => getRandomPrompt(form.getValues().mood as MoodType)}
                    >
                      <SunMoon className="h-4 w-4" />
                      <span className="sr-only">New prompt</span>
                    </Button>
                  </div>
                )}
                
                {/* Journal entry */}
                <FormField
                  control={form.control}
                  name="journalEntry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Journal Entry</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your thoughts here..." 
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setShowEntrySheet(false);
                      setCurrentPrompt(null);
                    }}
                    disabled={createEntryMutation.isPending}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={createEntryMutation.isPending}
                  >
                    {createEntryMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}