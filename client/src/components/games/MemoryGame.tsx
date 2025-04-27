import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, RefreshCw } from "lucide-react";

// Emoji cards for the memory game
const emojis = ['🌸', '🌼', '🌈', '🌞', '🌟', '🌵', '🍄', '🦄'];

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const totalPairs = emojis.length;

  // Initialize the game
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    // Create pairs of cards and shuffle them
    const cardPairs = [...emojis, ...emojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setIsGameComplete(false);
    setMatchedPairs(0);
  };

  const handleCardClick = (id: number) => {
    // Don't allow clicks if already 2 cards are flipped or the card is already matched/flipped
    const clickedCard = cards.find(card => card.id === id);
    if (
      flippedCards.length === 2 || 
      flippedCards.includes(id) || 
      clickedCard?.isMatched
    ) {
      return;
    }

    // Flip the card
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    // Update the card state
    const newCards = cards.map(card => 
      card.id === id ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    // Check for matches if two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(card => card.id === firstId);
      const secondCard = newCards.find(card => card.id === secondId);

      if (firstCard?.emoji === secondCard?.emoji) {
        // If cards match, mark them as matched
        const updatedCards = newCards.map(card => 
          card.id === firstId || card.id === secondId 
            ? { ...card, isMatched: true } 
            : card
        );
        setCards(updatedCards);
        setFlippedCards([]);
        setMatchedPairs(prev => {
          const newMatchedPairs = prev + 1;
          if (newMatchedPairs === totalPairs) {
            setIsGameComplete(true);
          }
          return newMatchedPairs;
        });
      } else {
        // If cards don't match, flip them back after a delay
        setTimeout(() => {
          const resetCards = newCards.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isFlipped: false } 
              : card
          );
          setCards(resetCards);
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Memory Match</CardTitle>
            <CardDescription>
              Find matching pairs to clear the board
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={initGame}>
            <RefreshCw size={16} className="mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">
            <span className="font-medium">Moves:</span> {moves}
          </div>
          <div className="text-sm">
            <span className="font-medium">Pairs:</span> {matchedPairs}/{totalPairs}
          </div>
        </div>

        {isGameComplete ? (
          <div className="text-center p-6 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4">
            <Check className="mx-auto mb-2 text-green-500" size={32} />
            <h3 className="text-xl font-bold mb-1">Congratulations!</h3>
            <p className="text-gray-600 dark:text-gray-300">
              You completed the game in {moves} moves
            </p>
            <Button 
              className="mt-4" 
              onClick={initGame}
            >
              Play Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => (
              <div 
                key={card.id} 
                className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer transform transition-all duration-300 ${
                  card.isFlipped 
                    ? 'bg-primary text-white rotate-y-180' 
                    : 'bg-muted hover:bg-muted/80'
                } ${card.isMatched ? 'opacity-60' : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                <span className="text-2xl">
                  {card.isFlipped ? card.emoji : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <AlertCircle size={14} className="inline mr-1" />
          Tip: Focus on remembering card positions to finish in fewer moves
        </div>
      </CardContent>
    </Card>
  );
}