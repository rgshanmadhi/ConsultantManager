import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMoodEmoji, getMoodColor } from "@/lib/utils";
import { MoodType } from "@shared/schema";
import { useState } from "react";

interface MoodTrackerProps {
  selectedMood: MoodType | null;
  onMoodSelect: (mood: MoodType) => void;
}

export default function MoodTracker({ selectedMood, onMoodSelect }: MoodTrackerProps) {
  const moods: MoodType[] = ["Happy", "Neutral", "Sad", "Angry", "Tired"];

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-medium mb-4">How are you feeling today?</h2>
        
        <div className="flex flex-wrap justify-between gap-2">
          {moods.map((mood) => (
            <Button
              key={mood}
              variant="outline"
              className={`emoji-button flex-1 min-w-[80px] flex flex-col items-center p-3 rounded-lg border-2 
                ${selectedMood === mood ? 'border-primary' : 'border-transparent'} 
                hover:border-primary focus:outline-none focus:border-primary transition-all`}
              onClick={() => onMoodSelect(mood)}
            >
              <span className={`text-4xl ${getMoodColor(mood)}`}>
                {getMoodEmoji(mood)}
              </span>
              <span className="mt-2 text-sm">{mood}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
