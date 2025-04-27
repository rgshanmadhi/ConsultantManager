import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import GamesGallery from "@/components/games/GamesGallery";

export default function GamesPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            className="mr-2 p-2" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold gradient-heading">Stress Relief Games</h1>
        </div>
        
        <GamesGallery />
      </div>
    </div>
  );
}