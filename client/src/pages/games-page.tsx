import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  CircleDashed,
  Wind,
  Dices,
  Sparkles,
  Brain,
  Yoga,
  HeartHandshake,
  Siren,
  BookHeart,
  Pencil,
  Timer,
  Check,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  X,
} from "lucide-react";

export default function GamesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Breathing exercise state
  const [breathing, setBreathing] = useState<"inhale" | "hold" | "exhale" | "rest" | "idle">("idle");
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const [breathingComplete, setBreathingComplete] = useState(0);
  const [breathingCycles, setBreathingCycles] = useState(0);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const breathingTimer = useRef<number | null>(null);
  
  // Memory game state
  const [memoryCards, setMemoryCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [isMemoryComplete, setIsMemoryComplete] = useState(false);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);
  const lockFlip = useRef(false);
  
  // Gratitude state
  const [gratitudeItems, setGratitudeItems] = useState<string[]>([]);
  const [newGratitudeItem, setNewGratitudeItem] = useState("");
  
  // Affirmations state
  const affirmations = [
    "I am capable of handling whatever comes my way today.",
    "I choose to focus on what I can control and let go of what I cannot.",
    "My needs and feelings are important, and I honor them.",
    "I am growing and evolving every day.",
    "I trust in my ability to make good decisions for myself.",
    "I am worthy of love and respect, just as I am.",
    "I embrace my imperfections as part of my unique self.",
    "I have the strength to overcome challenges.",
    "I am resilient and can bounce back from setbacks.",
    "I am enough, exactly as I am right now."
  ];
  
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  
  // Initialize memory game
  const initializeMemoryGame = () => {
    setIsMemoryLoading(true);
    // Reset all state
    setFlippedCards([]);
    setMatchedPairs(0);
    setMemoryMoves(0);
    setIsMemoryComplete(false);
    
    // Create pairs of cards
    const emojis = ["🌟", "🌈", "🌺", "🌞", "🌻", "🌴", "🐬", "🦋"];
    const cardPairs = [...emojis, ...emojis].map((emoji, index) => ({
      id: index,
      emoji,
      flipped: false,
      matched: false
    }));
    
    // Shuffle cards
    const shuffledCards = [...cardPairs].sort(() => Math.random() - 0.5);
    
    // Set with slight delay to allow animation
    setTimeout(() => {
      setMemoryCards(shuffledCards);
      setIsMemoryLoading(false);
    }, 500);
  };
  
  // Handle card flip in memory game
  const handleCardFlip = (id: number) => {
    // Don't allow flips if we already have 2 cards flipped or if this card is already flipped/matched
    if (
      lockFlip.current || 
      flippedCards.length >= 2 || 
      flippedCards.includes(id) || 
      memoryCards.find(card => card.id === id)?.matched
    ) {
      return;
    }
    
    // Flip the card
    const newCards = memoryCards.map(card => 
      card.id === id ? { ...card, flipped: true } : card
    );
    setMemoryCards(newCards);
    
    // Add to flipped cards
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    // If we have 2 cards flipped, check for match
    if (newFlippedCards.length === 2) {
      setMemoryMoves(moves => moves + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(card => card.id === firstId);
      const secondCard = newCards.find(card => card.id === secondId);
      
      if (firstCard?.emoji === secondCard?.emoji) {
        // Match!
        lockFlip.current = true;
        setTimeout(() => {
          const matchedCards = newCards.map(card => 
            card.id === firstId || card.id === secondId
              ? { ...card, matched: true }
              : card
          );
          setMemoryCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs(pairs => pairs + 1);
          
          // Check if all pairs are matched
          if (matchedPairs + 1 === emojis.length) {
            setIsMemoryComplete(true);
            toast({
              title: "Memory Game Complete!",
              description: `You completed the game in ${memoryMoves + 1} moves.`,
            });
          }
          lockFlip.current = false;
        }, 500);
      } else {
        // No match, flip back
        lockFlip.current = true;
        setTimeout(() => {
          const resetCards = newCards.map(card => 
            (card.id === firstId || card.id === secondId) && !card.matched
              ? { ...card, flipped: false }
              : card
          );
          setMemoryCards(resetCards);
          setFlippedCards([]);
          lockFlip.current = false;
        }, 1000);
      }
    }
  };
  
  // Start breathing exercise
  const startBreathingExercise = () => {
    setIsBreathingActive(true);
    setBreathingCycles(0);
    setBreathingComplete(0);
    
    // Start the breathing cycle
    setBreathing("inhale");
    setBreathingSeconds(4); // 4 seconds to inhale
    
    // Set up timer
    if (breathingTimer.current) {
      clearInterval(breathingTimer.current);
    }
    
    breathingTimer.current = window.setInterval(() => {
      setBreathingSeconds(seconds => {
        if (seconds <= 1) {
          // Transition to next phase
          setBreathing(current => {
            switch (current) {
              case "inhale":
                return "hold";
              case "hold":
                return "exhale";
              case "exhale":
                return "rest";
              case "rest":
                // Completed one cycle
                setBreathingCycles(cycles => cycles + 1);
                setBreathingComplete(complete => complete + 25); // 25% per cycle (4 cycles total)
                
                // Check if we've done 4 cycles
                if (breathingCycles >= 3) {
                  stopBreathingExercise();
                  toast({
                    title: "Breathing Exercise Complete",
                    description: "Great job! You've completed the 4-7-8 breathing exercise."
                  });
                  return "idle";
                }
                return "inhale";
              default:
                return "inhale";
            }
          });
          
          // Set seconds for next phase
          switch (breathing) {
            case "inhale":
              return 7; // 7 seconds to hold
            case "hold":
              return 8; // 8 seconds to exhale
            case "exhale":
              return 2; // 2 seconds to rest
            case "rest":
              return 4; // 4 seconds to inhale again
            default:
              return 4;
          }
        }
        return seconds - 1;
      });
    }, 1000);
  };
  
  // Stop breathing exercise
  const stopBreathingExercise = () => {
    if (breathingTimer.current) {
      clearInterval(breathingTimer.current);
      breathingTimer.current = null;
    }
    
    setIsBreathingActive(false);
    setBreathing("idle");
  };
  
  // Add gratitude item
  const addGratitudeItem = () => {
    if (newGratitudeItem.trim() === "") return;
    
    setGratitudeItems([...gratitudeItems, newGratitudeItem.trim()]);
    setNewGratitudeItem("");
    
    toast({
      title: "Gratitude Added",
      description: "Your gratitude item has been added to your list."
    });
  };
  
  // Remove gratitude item
  const removeGratitudeItem = (index: number) => {
    setGratitudeItems(gratitudeItems.filter((_, i) => i !== index));
  };
  
  // Change affirmation
  const changeAffirmation = (direction: "next" | "prev") => {
    if (direction === "next") {
      setCurrentAffirmation((current) => (current + 1) % affirmations.length);
    } else {
      setCurrentAffirmation((current) => (current - 1 + affirmations.length) % affirmations.length);
    }
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (breathingTimer.current) {
        clearInterval(breathingTimer.current);
      }
    };
  }, []);
  
  // Initialize memory game on component mount
  useEffect(() => {
    initializeMemoryGame();
  }, []);
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Wellness Activities</h1>
          <p className="text-muted-foreground">
            Explore activities to support your mental wellbeing
          </p>
        </div>
        
        {/* Activities Tabs */}
        <Tabs defaultValue="breathing" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            <TabsTrigger value="breathing">
              <Wind className="w-4 h-4 mr-2" />
              Breathing
            </TabsTrigger>
            <TabsTrigger value="memory">
              <Brain className="w-4 h-4 mr-2" />
              Memory Game
            </TabsTrigger>
            <TabsTrigger value="gratitude">
              <HeartHandshake className="w-4 h-4 mr-2" />
              Gratitude
            </TabsTrigger>
            <TabsTrigger value="affirmations">
              <Sparkles className="w-4 h-4 mr-2" />
              Affirmations
            </TabsTrigger>
          </TabsList>
          
          {/* Breathing Exercise */}
          <TabsContent value="breathing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wind className="w-5 h-5 mr-2 text-primary" />
                  4-7-8 Breathing Exercise
                </CardTitle>
                <CardDescription>
                  A relaxation technique to help reduce anxiety and help you sleep
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center">
                  {/* Breathing visualization */}
                  <div className="relative w-60 h-60 my-6">
                    <div 
                      className={`absolute top-0 left-0 w-full h-full rounded-full border-4 border-primary transition-all duration-1000 flex items-center justify-center ${
                        breathing === "idle"
                          ? "scale-90 opacity-80"
                          : breathing === "inhale"
                          ? "scale-100 opacity-100 animate-pulse"
                          : breathing === "hold"
                          ? "scale-100 opacity-100"
                          : "scale-80 opacity-80"
                      }`}
                    >
                      <div className="text-xl font-medium">
                        {breathing === "idle" ? (
                          "Ready?"
                        ) : (
                          <>
                            {breathing === "inhale" && "Inhale"}
                            {breathing === "hold" && "Hold"}
                            {breathing === "exhale" && "Exhale"}
                            {breathing === "rest" && "Rest"}
                            <div className="text-3xl font-bold mt-2">{breathingSeconds}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 transition-all duration-1000 ${
                        breathing === "idle"
                          ? "scale-90"
                          : breathing === "inhale"
                          ? "scale-110"
                          : breathing === "hold"
                          ? "scale-110"
                          : "scale-75"
                      }`}
                    ></div>
                  </div>
                  
                  {/* Progress bar */}
                  {isBreathingActive && (
                    <div className="w-full max-w-md space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cycle {breathingCycles + 1} of 4</span>
                        <span>{breathingComplete}% complete</span>
                      </div>
                      <Progress value={breathingComplete} />
                    </div>
                  )}
                  
                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-muted rounded-lg text-sm max-w-md">
                    <h4 className="font-medium mb-2">How it works:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Inhale quietly through your nose for 4 seconds</li>
                      <li>Hold your breath for 7 seconds</li>
                      <li>Exhale completely through your mouth for 8 seconds</li>
                      <li>Repeat the cycle 4 times</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                {!isBreathingActive ? (
                  <Button onClick={startBreathingExercise}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Breathing Exercise
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stopBreathingExercise}>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Exercise
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Memory Game */}
          <TabsContent value="memory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-primary" />
                      Memory Match Game
                    </CardTitle>
                    <CardDescription>
                      Match pairs to improve focus and cognitive skills
                    </CardDescription>
                  </div>
                  
                  {/* Game stats */}
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <span className="text-muted-foreground mr-1">Moves:</span>
                      <span className="font-medium">{memoryMoves}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground mr-1">Matches:</span>
                      <span className="font-medium">{matchedPairs}/8</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Memory grid */}
                {isMemoryLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                    {memoryCards.map(card => (
                      <div 
                        key={card.id}
                        className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 transform ${
                          card.flipped ? "rotate-y-180" : ""
                        } ${
                          card.matched 
                            ? "bg-primary/20 cursor-default" 
                            : card.flipped 
                            ? "bg-primary" 
                            : "bg-card hover:bg-accent"
                        } border flex items-center justify-center text-2xl font-bold`}
                        onClick={() => handleCardFlip(card.id)}
                      >
                        {card.flipped || card.matched ? card.emoji : ""}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Game complete message */}
                {isMemoryComplete && (
                  <div className="mt-6 bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-1">Congratulations! 🎉</h3>
                    <p>You completed the memory game in {memoryMoves} moves!</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  onClick={initializeMemoryGame} 
                  variant={isMemoryComplete ? "default" : "outline"}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isMemoryComplete ? "Play Again" : "Restart Game"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Gratitude Journal */}
          <TabsContent value="gratitude" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HeartHandshake className="w-5 h-5 mr-2 text-primary" />
                  Gratitude Journal
                </CardTitle>
                <CardDescription>
                  Record things you're thankful for to cultivate positive thinking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add gratitude item */}
                <div className="flex space-x-2">
                  <Input
                    value={newGratitudeItem}
                    onChange={(e) => setNewGratitudeItem(e.target.value)}
                    placeholder="I'm grateful for..."
                    onKeyDown={(e) => e.key === "Enter" && addGratitudeItem()}
                  />
                  <Button onClick={addGratitudeItem}>
                    Add
                  </Button>
                </div>
                
                {/* Gratitude list */}
                <div className="border rounded-lg divide-y">
                  {gratitudeItems.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <BookHeart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Your gratitude list is empty. Add things you're grateful for above.</p>
                    </div>
                  ) : (
                    gratitudeItems.map((item, index) => (
                      <div key={index} className="flex items-center p-3 group">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <p className="flex-1">{item}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGratitudeItem(index)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Tips */}
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <h4 className="font-medium mb-2">Tips for practicing gratitude:</h4>
                  <ul className="space-y-1 list-disc pl-5">
                    <li>Be specific about what you're grateful for</li>
                    <li>Include both small daily joys and bigger life aspects</li>
                    <li>Try to add at least 3 items each day</li>
                    <li>Reflect on why each item matters to you</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Affirmations */}
          <TabsContent value="affirmations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  Positive Affirmations
                </CardTitle>
                <CardDescription>
                  Use these affirmations to build a positive mindset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Affirmation card */}
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-lg text-center relative overflow-hidden">
                  <Sparkles className="absolute top-4 left-4 h-6 w-6 text-primary/30" />
                  <div className="py-4">
                    <h3 className="text-xl font-medium italic mb-2">
                      "{affirmations[currentAffirmation]}"
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Affirmation {currentAffirmation + 1} of {affirmations.length}
                    </p>
                  </div>
                  <Sparkles className="absolute bottom-4 right-4 h-6 w-6 text-primary/30" />
                </div>
                
                {/* Navigation buttons */}
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => changeAffirmation("prev")}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => changeAffirmation("next")}
                  >
                    Next Affirmation
                  </Button>
                </div>
                
                {/* How to use */}
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <h4 className="font-medium mb-2">How to use affirmations:</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Read the affirmation slowly out loud or in your mind</li>
                    <li>Take a deep breath and repeat it again</li>
                    <li>Try to truly believe the statement as you say it</li>
                    <li>Practice daily for best results</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}