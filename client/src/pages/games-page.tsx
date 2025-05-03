import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HeartIcon,
  PencilIcon,
  HeadphonesIcon,
  LightbulbIcon,
  SmileIcon
} from "lucide-react";

// Custom Breath icon
function BreathCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  );
}

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState("breathing");
  const [breathingPhase, setBreathingPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [timerProgress, setTimerProgress] = useState(0);
  const [timerInterval, setTimerIntervalState] = useState<NodeJS.Timeout | null>(null);

  // Breathing exercise state
  const startBreathingExercise = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const cycleLength = 13000; // 13 seconds per cycle
    const inhaleTime = 4000;
    const holdTime = 4000;
    const exhaleTime = 5000;
    
    let startTime = Date.now();
    let phase: "inhale" | "hold" | "exhale" = "inhale";
    setBreathingPhase("inhale");
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < inhaleTime) {
        // Inhale phase
        setTimerProgress((elapsed / inhaleTime) * 100);
        phase = "inhale";
        setBreathingPhase("inhale");
      } else if (elapsed < inhaleTime + holdTime) {
        // Hold phase
        setTimerProgress(((elapsed - inhaleTime) / holdTime) * 100);
        if (phase !== "hold") {
          phase = "hold";
          setBreathingPhase("hold");
        }
      } else if (elapsed < cycleLength) {
        // Exhale phase
        setTimerProgress(((elapsed - inhaleTime - holdTime) / exhaleTime) * 100);
        if (phase !== "exhale") {
          phase = "exhale";
          setBreathingPhase("exhale");
        }
      } else {
        // Reset cycle
        startTime = Date.now();
        phase = "inhale";
        setBreathingPhase("inhale");
      }
    }, 50);
    
    setTimerIntervalState(interval);
  };
  
  const stopBreathingExercise = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerIntervalState(null);
    }
    setBreathingPhase("idle");
    setTimerProgress(0);
  };

  // Memory game state
  const [memoryCards, setMemoryCards] = useState<Array<{ id: number, emoji: string, flipped: boolean, matched: boolean }>>([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  
  // Initialize memory game
  const initializeMemoryGame = () => {
    const emojis = ["🌟", "🌈", "🌸", "🌴", "🌞", "❤️", "🔮", "🦋"];
    let cards = emojis.concat(emojis) // Duplicate each emoji
      .sort(() => Math.random() - 0.5) // Shuffle
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }));
    
    setMemoryCards(cards);
    setFlippedCount(0);
    setFlippedIndexes([]);
    setMatchedPairs(0);
  };
  
  // Handle card flips
  const flipCard = (index: number) => {
    // Return if this card is already flipped or we already have 2 cards flipped
    if (memoryCards[index].flipped || flippedCount === 2) return;
    
    // Flip this card
    let newCards = [...memoryCards];
    newCards[index].flipped = true;
    setMemoryCards(newCards);
    
    // Add this card to flipped indexes
    const newFlippedIndexes = [...flippedIndexes, index];
    setFlippedIndexes(newFlippedIndexes);
    setFlippedCount(newFlippedIndexes.length);
    
    // If we have 2 cards flipped, check for a match
    if (newFlippedIndexes.length === 2) {
      const match = 
        memoryCards[newFlippedIndexes[0]].emoji === 
        memoryCards[newFlippedIndexes[1]].emoji;
      
      setTimeout(() => {
        let newerCards = [...newCards];
        
        if (match) {
          // Mark cards as matched
          newerCards[newFlippedIndexes[0]].matched = true;
          newerCards[newFlippedIndexes[1]].matched = true;
          setMatchedPairs(matchedPairs + 1);
        } else {
          // Flip cards back
          newerCards[newFlippedIndexes[0]].flipped = false;
          newerCards[newFlippedIndexes[1]].flipped = false;
        }
        
        setMemoryCards(newerCards);
        setFlippedCount(0);
        setFlippedIndexes([]);
      }, 1000);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wellness Activities</h1>
          <p className="text-muted-foreground">
            Engage in activities designed to improve your mental well-being
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="breathing">Breathing</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="drawing">Drawing</TabsTrigger>
            <TabsTrigger value="meditation">Meditation</TabsTrigger>
            <TabsTrigger value="gratitude">Gratitude</TabsTrigger>
            <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
          </TabsList>
          
          {/* Breathing Exercise */}
          <TabsContent value="breathing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deep Breathing Exercise</CardTitle>
                <CardDescription>
                  A simple breathing technique to help reduce stress and anxiety
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative mx-auto" style={{ width: "250px", height: "250px" }}>
                  <div 
                    className={`absolute inset-0 rounded-full flex items-center justify-center text-2xl font-medium transition-all duration-500 ease-in-out ${
                      breathingPhase === "idle" 
                        ? "bg-muted text-muted-foreground" 
                        : breathingPhase === "inhale" 
                        ? "bg-blue-500/20 text-blue-600 animate-pulse scale-100" 
                        : breathingPhase === "hold" 
                        ? "bg-indigo-500/20 text-indigo-600 scale-110" 
                        : "bg-green-500/20 text-green-600 scale-90"
                    }`}
                    style={{
                      transform: breathingPhase === "idle" 
                        ? "scale(1)" 
                        : breathingPhase === "inhale" 
                        ? "scale(1.2)" 
                        : breathingPhase === "hold" 
                        ? "scale(1.2)" 
                        : "scale(1)",
                      transition: "transform 2s ease-in-out"
                    }}
                  >
                    {breathingPhase === "idle" ? "Ready" : breathingPhase === "inhale" ? "Inhale" : breathingPhase === "hold" ? "Hold" : "Exhale"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(timerProgress)}%</span>
                  </div>
                  <Progress value={timerProgress} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Instructions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Find a comfortable position</li>
                    <li>Follow the breathing rhythm on screen</li>
                    <li>Inhale deeply through your nose for 4 seconds</li>
                    <li>Hold your breath for 4 seconds</li>
                    <li>Exhale slowly through your mouth for 5 seconds</li>
                    <li>Repeat for 3-5 minutes</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                {breathingPhase === "idle" ? (
                  <Button onClick={startBreathingExercise} className="w-full">
                    Start Breathing Exercise
                  </Button>
                ) : (
                  <Button onClick={stopBreathingExercise} variant="outline" className="w-full">
                    Stop Exercise
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Benefits of Deep Breathing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <HeartIcon className="h-5 w-5 text-red-500" />
                      Reduces Stress and Anxiety
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Deep breathing activates the parasympathetic nervous system, which helps calm the body and mind.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <HeadphonesIcon className="h-5 w-5 text-blue-500" />
                      Improves Focus
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Breathing exercises can enhance concentration and mental clarity.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <SmileIcon className="h-5 w-5 text-yellow-500" />
                      Enhances Mood
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Regular deep breathing may help reduce symptoms of depression and improve overall well-being.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <LightbulbIcon className="h-5 w-5 text-amber-500" />
                      Improves Sleep
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Practicing deep breathing before bed can help you relax and fall asleep more easily.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Memory Game */}
          <TabsContent value="memory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Match Game</CardTitle>
                <CardDescription>
                  Exercise your brain and improve focus with this memory matching game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {memoryCards.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-3 mx-auto max-w-md">
                      {memoryCards.map((card, index) => (
                        <div
                          key={card.id}
                          onClick={() => flipCard(index)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-3xl cursor-pointer transform transition-all duration-300 ${
                            card.flipped || card.matched 
                              ? "bg-primary/10 rotate-y-180"
                              : "bg-primary hover:bg-primary/90"
                          } ${card.matched ? "opacity-50" : ""}`}
                        >
                          {card.flipped || card.matched ? card.emoji : ""}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">Matched:</span>
                        <span className="ml-2 font-bold">{matchedPairs} / 8</span>
                      </div>
                      
                      {matchedPairs === 8 && (
                        <div className="text-green-600 font-medium">
                          Congratulations! You've completed the game!
                        </div>
                      )}
                      
                      <Button onClick={initializeMemoryGame} variant="outline" size="sm">
                        {memoryCards.length > 0 ? "Restart Game" : "Start Game"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium mb-4">How to Play:</h3>
                    <p className="text-muted-foreground mb-6">
                      Match pairs of cards by flipping them two at a time. 
                      Try to remember where each emoji is located and match all pairs.
                    </p>
                    <Button onClick={initializeMemoryGame}>
                      Start Memory Game
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Benefits of Memory Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Improved Concentration</h4>
                    <p className="text-sm text-muted-foreground">
                      Memory games require focus and attention, helping to train your brain to concentrate better.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Enhanced Short-Term Memory</h4>
                    <p className="text-sm text-muted-foreground">
                      Regularly playing memory games strengthens neural connections associated with short-term memory.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Reduced Stress</h4>
                    <p className="text-sm text-muted-foreground">
                      Engaging in gameplay provides a mental break and can help reduce stress and anxiety.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Cognitive Exercise</h4>
                    <p className="text-sm text-muted-foreground">
                      Memory games provide a workout for your brain, keeping cognitive functions sharp.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other Tabs - Placeholder Content */}
          <TabsContent value="drawing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zen Drawing</CardTitle>
                <CardDescription>
                  Express yourself through art and creative drawing
                </CardDescription>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <PencilIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Drawing Activity Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're still working on this activity. Check back soon for a full drawing experience.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="meditation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Guided Meditation</CardTitle>
                <CardDescription>
                  Practice mindfulness and meditation
                </CardDescription>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <HeadphonesIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Meditation Activity Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're still working on this activity. Check back soon for guided meditation sessions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gratitude" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gratitude Journal</CardTitle>
                <CardDescription>
                  Practice gratitude through journaling
                </CardDescription>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <LightbulbIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Gratitude Activity Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're still working on this activity. Check back soon for a gratitude journaling experience.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="affirmations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Positive Affirmations</CardTitle>
                <CardDescription>
                  Build confidence through positive affirmations
                </CardDescription>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <SmileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Affirmations Activity Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're still working on this activity. Check back soon for daily affirmations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}