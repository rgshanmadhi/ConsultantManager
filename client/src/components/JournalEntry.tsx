import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, calculateCharCount, getSentimentIcon } from "@/lib/utils";
import { MoodType, SentimentType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JournalEntryProps {
  mood: MoodType | null;
  onSave: (journalText: string, sentiment: SentimentType) => Promise<void>;
  isSubmitting: boolean;
}

export default function JournalEntry({ mood, onSave, isSubmitting }: JournalEntryProps) {
  const [journalText, setJournalText] = useState("");
  const [sentiment, setSentiment] = useState<SentimentType>("Neutral");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const maxLength = 1000;
  
  // Analyze sentiment when journal text changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (journalText.trim().length > 10) {
        analyzeSentiment(journalText);
      }
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }, [journalText]);
  
  async function analyzeSentiment(text: string) {
    if (text.trim().length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest(
        "GET", 
        `/api/analyze-sentiment?text=${encodeURIComponent(text)}`,
      );
      const data = await response.json();
      setSentiment(data.sentiment);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      // Use default sentiment in case of error
      setSentiment("Neutral");
    } finally {
      setIsAnalyzing(false);
    }
  }
  
  const handleSave = async () => {
    if (!journalText.trim()) {
      toast({
        title: "Missing journal entry",
        description: "Please write something in your journal before saving.",
        variant: "destructive"
      });
      return;
    }
    
    if (!mood) {
      toast({
        title: "Missing mood",
        description: "Please select a mood before saving your entry.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await onSave(journalText, sentiment);
      // Clear journal text after successful save
      setJournalText("");
    } catch (error) {
      console.error("Error saving journal entry:", error);
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Journal Entry</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(new Date())}</span>
        </div>
        
        <div className="mb-4">
          <Textarea
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 min-h-[200px] bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Write about your day, thoughts, and feelings..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            maxLength={maxLength}
          />
          <div className="flex justify-end mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {calculateCharCount(journalText, maxLength)}
            </span>
          </div>
        </div>
        
        {/* Sentiment Analysis Result */}
        <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sentiment Analysis</h3>
          <div className="flex items-center">
            {isAnalyzing ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-primary rounded-full"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              <>
                <span className="material-icons mr-2">{getSentimentIcon(sentiment)}</span>
                <span>{sentiment}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || !journalText.trim() || !mood}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save Entry
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
