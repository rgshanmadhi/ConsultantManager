import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Entry } from "@shared/schema";
import { formatDate, getMoodEmoji, getMoodBgColor, getMoodColor, truncateText } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PastEntriesProps {
  entries: Entry[];
  isLoading: boolean;
  error: Error | null;
}

export default function PastEntries({ entries, isLoading, error }: PastEntriesProps) {
  const [showCount, setShowCount] = useState(3);
  
  const handleViewMore = () => {
    setShowCount(prevCount => prevCount + 3);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-medium mb-4">Past Entries</h2>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="bg-destructive bg-opacity-10 text-destructive p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <p className="font-medium">Unable to load entries</p>
                <p className="text-sm">{error.message || "Please check your connection and try again."}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Entries list */}
        {!isLoading && !error && (
          <div>
            {entries.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No entries yet. Start tracking your mood!
              </div>
            ) : (
              <>
                <div id="entries-list">
                  {entries.slice(0, showCount).map((entry) => (
                    <div key={entry.id} className="border-b border-gray-200 dark:border-gray-700 py-3 last:border-0">
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <span className={`text-xl mr-2 ${getMoodColor(entry.mood)}`}>
                            {getMoodEmoji(entry.mood)}
                          </span>
                          <span className="font-medium">{formatDate(entry.date)}</span>
                        </div>
                        <span className={`text-xs ${getMoodBgColor(entry.mood)} ${getMoodColor(entry.mood)} px-2 py-1 rounded-full`}>
                          {entry.mood}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {truncateText(entry.journalEntry, 120)}
                      </p>
                    </div>
                  ))}
                </div>
                
                {entries.length > showCount && (
                  <div className="mt-4 flex justify-center">
                    <Button 
                      variant="link" 
                      onClick={handleViewMore}
                      className="text-primary hover:underline focus:outline-none text-sm flex items-center"
                    >
                      <span>View more entries</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
