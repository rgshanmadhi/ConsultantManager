import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Entry, MoodType } from "@shared/schema";
import { MoodFrequency, MoodData } from "@/lib/types";

interface MoodTrendsProps {
  entries: Entry[];
}

export default function MoodTrends({ entries }: MoodTrendsProps) {
  const [moodFrequencies, setMoodFrequencies] = useState<MoodFrequency[]>([]);
  const [mostFrequentMood, setMostFrequentMood] = useState<string>("");
  
  useEffect(() => {
    if (entries.length > 0) {
      calculateMoodFrequencies();
    }
  }, [entries]);
  
  const calculateMoodFrequencies = () => {
    // Count occurrences of each mood
    const moodData: MoodData = {};
    const totalEntries = entries.length;
    
    // Initialize all moods with 0 count
    ["Happy", "Neutral", "Sad", "Angry", "Tired"].forEach(mood => {
      moodData[mood] = { count: 0 };
    });
    
    // Count actual mood occurrences
    entries.forEach(entry => {
      if (moodData[entry.mood]) {
        moodData[entry.mood].count += 1;
      }
    });
    
    // Convert to array and calculate percentages
    const frequencies: MoodFrequency[] = Object.keys(moodData).map(mood => ({
      mood: mood as MoodType,
      count: moodData[mood].count,
      percentage: totalEntries > 0 ? (moodData[mood].count / totalEntries) * 100 : 0
    }));
    
    // Sort by count (descending)
    frequencies.sort((a, b) => b.count - a.count);
    
    setMoodFrequencies(frequencies);
    setMostFrequentMood(frequencies[0]?.mood || "");
  };
  
  const getMoodColor = (mood: MoodType): string => {
    const moodColors: Record<MoodType, string> = {
      Happy: "#FFD700",
      Neutral: "#A9A9A9",
      Sad: "#6495ED",
      Angry: "#FF6347",
      Tired: "#8A2BE2"
    };
    
    return moodColors[mood];
  };
  
  const getTextColor = (mood: MoodType): string => {
    const textColors: Record<MoodType, string> = {
      Happy: "text-[#FFD700]",
      Neutral: "text-[#A9A9A9]",
      Sad: "text-[#6495ED]",
      Angry: "text-[#FF6347]",
      Tired: "text-[#8A2BE2]"
    };
    
    return textColors[mood];
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-medium mb-4">Mood Trends</h2>
        
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No entries yet. Start tracking your mood to see trends.
          </div>
        ) : (
          <>
            {/* Chart representation */}
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-end px-4">
                {moodFrequencies.map((moodFreq, index) => (
                  <div 
                    key={index}
                    className="w-1/5 rounded-t-md transition-all duration-500"
                    style={{ 
                      backgroundColor: getMoodColor(moodFreq.mood),
                      height: `${moodFreq.percentage}%`
                    }}
                  ></div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-500 dark:text-gray-400">
                {moodFrequencies.map((moodFreq, index) => (
                  <div key={index}>{moodFreq.mood}</div>
                ))}
              </div>
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between items-start text-xs text-gray-500 dark:text-gray-400">
                <div>100%</div>
                <div>75%</div>
                <div>50%</div>
                <div>25%</div>
                <div>0%</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              {mostFrequentMood && (
                <p>Most frequent mood: <span className={`font-medium ${getTextColor(mostFrequentMood as MoodType)}`}>
                  {mostFrequentMood}
                </span></p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
