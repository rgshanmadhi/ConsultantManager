import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { MoodType, SentimentType } from "@shared/schema";
import MoodTracker from "@/components/MoodTracker";
import JournalEntry from "@/components/JournalEntry";
import { apiRequest } from "@/lib/queryClient";

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

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
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Journal Your Thoughts</h1>
        
        <div className="space-y-8">
          {/* Mood Tracker */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
            <MoodTracker 
              selectedMood={selectedMood} 
              onMoodSelect={handleMoodSelect} 
            />
          </div>
          
          {/* Journal Entry */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Express your thoughts</h2>
            <JournalEntry 
              mood={selectedMood} 
              onSave={handleSaveEntry}
              isSubmitting={createEntryMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}