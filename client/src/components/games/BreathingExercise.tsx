import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

export default function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [counter, setCounter] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  
  const maxCycles = 3;

  // Set up the breathing cycle
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          // Move to next phase when counter reaches 0
          switch (currentPhase) {
            case 'inhale':
              setCurrentPhase('hold');
              return 7; // Hold for 7 seconds
            case 'hold':
              setCurrentPhase('exhale');
              return 8; // Exhale for 8 seconds
            case 'exhale':
              setCurrentPhase('rest');
              return 4; // Rest for 4 seconds
            case 'rest':
              // Move to next cycle
              setCurrentPhase('inhale');
              setCycleCount((prev) => {
                const nextCount = prev + 1;
                if (nextCount >= maxCycles) {
                  setIsActive(false);
                  return 0;
                }
                return nextCount;
              });
              return 4; // Inhale for 4 seconds
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, currentPhase, cycleCount]);

  const handleStartStop = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      setCurrentPhase('inhale');
      setCounter(4);
      setCycleCount(0);
    }
  };

  const getInstructions = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe in slowly through your nose';
      case 'hold':
        return 'Hold your breath';
      case 'exhale':
        return 'Exhale slowly through your mouth';
      case 'rest':
        return 'Rest before the next breath';
    }
  };

  const calculateScale = () => {
    switch (currentPhase) {
      case 'inhale':
        return 1 + (4 - counter) * 0.2; // Grow from 1 to 1.8
      case 'hold':
        return 1.8; // Stay at maximum
      case 'exhale':
        return 1.8 - (8 - counter) * 0.1; // Shrink from 1.8 to 1
      case 'rest':
        return 1; // Stay at minimum
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">4-7-8 Breathing Exercise</CardTitle>
        <CardDescription>
          A simple breathing technique that promotes relaxation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <div 
            className="w-40 h-40 mx-auto rounded-full flex items-center justify-center mb-6 bg-gradient-to-r from-blue-200 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 transition-transform duration-1000"
            style={{ 
              transform: `scale(${isActive ? calculateScale() : 1})`,
            }}
          >
            <div className="text-2xl font-bold text-primary">
              {isActive ? counter : "Start"}
            </div>
          </div>
          
          <div className="h-12">
            {isActive && (
              <div className="animate-fade-in">
                <p className="text-lg font-medium mb-1">{getInstructions()}</p>
                <p className="text-sm text-muted-foreground">
                  Cycle {cycleCount + 1} of {maxCycles}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <Button
          onClick={handleStartStop}
          className="flex items-center gap-2 w-full max-w-xs mx-auto"
          size="lg"
        >
          {isActive ? (
            <>
              <Pause size={18} /> Stop Exercise
            </>
          ) : (
            <>
              <Play size={18} /> Start Breathing
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}