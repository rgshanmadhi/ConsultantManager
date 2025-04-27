import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Brain, PenTool } from "lucide-react";
import BreathingExercise from "./BreathingExercise";
import MemoryGame from "./MemoryGame";
import ZenDrawing from "./ZenDrawing";

export default function GamesGallery() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    {
      id: "breathing",
      name: "Breathing Exercise",
      description: "Calm your mind with guided breathing",
      icon: <Wind className="h-8 w-8 text-blue-500" />,
      component: <BreathingExercise />
    },
    {
      id: "memory",
      name: "Memory Match",
      description: "Boost your focus with a fun memory game",
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      component: <MemoryGame />
    },
    {
      id: "drawing",
      name: "Zen Drawing",
      description: "Express yourself creatively and reduce stress",
      icon: <PenTool className="h-8 w-8 text-teal-500" />,
      component: <ZenDrawing />
    }
  ];

  return (
    <div className="space-y-6">
      {!activeGame ? (
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold gradient-heading mb-2">Stress Relief Games</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take a mental break with these interactive games designed to reduce stress and improve focus
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card key={game.id} className="hover-card gradient-card">
                <CardHeader className="pb-2 text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    {game.icon}
                  </div>
                  <CardTitle className="text-xl">{game.name}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <Button 
                    onClick={() => setActiveGame(game.id)}
                    className="animate-button w-full"
                  >
                    Play
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-heading">
              {games.find(g => g.id === activeGame)?.name}
            </h2>
            <Button 
              variant="outline" 
              onClick={() => setActiveGame(null)}
            >
              Back to Games
            </Button>
          </div>
          
          <div className="h-[600px] max-h-[80vh]">
            {games.find(g => g.id === activeGame)?.component}
          </div>
        </div>
      )}
    </div>
  );
}