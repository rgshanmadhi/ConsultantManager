import { Card, CardContent } from "@/components/ui/card";
import { MoodType, activitiesMapping } from "@shared/schema";
import { getMoodColor } from "@/lib/utils";

interface ActivityRecommendationsProps {
  mood: MoodType | null;
}

export default function ActivityRecommendations({ mood }: ActivityRecommendationsProps) {
  // Default to Neutral mood if none is selected
  const currentMood = mood || "Neutral";
  const activities = activitiesMapping[currentMood];
  
  // Icons for activities
  const activityIcons: Record<string, string> = {
    "Share your happiness": "celebration",
    "Practice gratitude": "favorite",
    "Do something creative": "palette",
    "Compliment someone": "chat",
    "Try something new": "explore",
    "Take a short walk": "directions_walk",
    "Read a book": "book",
    "Listen to music": "music_note",
    "Connect with a friend": "people",
    "Try mindfulness": "self_improvement",
    "Practice self-care": "spa",
    "Take a walk outside": "terrain",
    "Call a friend": "call",
    "Listen to uplifting music": "headphones",
    "Take deep breaths": "air",
    "Write down your feelings": "edit_note",
    "Exercise": "fitness_center",
    "Practice meditation": "brightness_low",
    "Talk to someone": "forum",
    "Take a power nap": "bedtime",
    "Drink some water": "water_drop",
    "Stretch your body": "accessibility_new",
    "Get some fresh air": "cloud",
    "Listen to energizing music": "library_music"
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-medium mb-4">Recommended Activities</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {activities.map((activity, index) => (
            <div 
              key={index} 
              className={`${getMoodColor(currentMood)} ${getMoodColor(currentMood).replace('text-', 'bg-')} bg-opacity-10 px-4 py-2 rounded-full flex items-center`}
            >
              <span className="material-icons text-sm mr-1">
                {activityIcons[activity] || "star"}
              </span>
              <span>{activity}</span>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>These activities are personalized based on your current mood and past entries.</p>
        </div>
      </CardContent>
    </Card>
  );
}
