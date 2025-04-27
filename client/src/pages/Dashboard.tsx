import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Entry, InsertEntry, MoodType, SentimentType } from "@shared/schema";

import Header from "@/components/Header";
import MoodTracker from "@/components/MoodTracker";
import JournalEntry from "@/components/JournalEntry";
import ActivityRecommendations from "@/components/ActivityRecommendations";
import CalendarView from "@/components/CalendarView";
import MoodTrends from "@/components/MoodTrends";
import PastEntries from "@/components/PastEntries";
import Footer from "@/components/Footer";

export default function Dashboard() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all entries
  const { 
    data: entries = [], 
    isLoading, 
    error 
  } = useQuery<Entry[]>({
    queryKey: ['/api/entries'],
  });
  
  // Create entry mutation
  const { mutate: createEntry, isPending: isSubmitting } = useMutation({
    mutationFn: async (entry: InsertEntry) => {
      const response = await apiRequest("POST", "/api/entries", entry);
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
    if (!selectedMood) return;
    
    const newEntry: InsertEntry = {
      mood: selectedMood,
      journalEntry: journalText,
      sentiment,
      date: new Date(),
    };
    
    createEntry(newEntry);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-6xl w-full mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Entry Creation */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <MoodTracker 
              selectedMood={selectedMood} 
              onMoodSelect={handleMoodSelect} 
            />
            
            <JournalEntry 
              mood={selectedMood}
              onSave={handleSaveEntry}
              isSubmitting={isSubmitting}
            />
            
            <ActivityRecommendations 
              mood={selectedMood} 
            />
          </div>
          
          {/* Right Column - Dashboard */}
          <div className="flex flex-col gap-6">
            <CalendarView 
              entries={entries} 
              onSelectDate={handleDateSelect}
              selectedDate={selectedDate}
            />
            
            <MoodTrends 
              entries={entries} 
            />
            
            <PastEntries 
              entries={entries}
              isLoading={isLoading}
              error={error as Error | null}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
