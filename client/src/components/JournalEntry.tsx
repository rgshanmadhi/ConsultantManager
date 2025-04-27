import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatDate, calculateCharCount, getSentimentIcon, getMoodColor } from "@/lib/utils";
import { MoodType, SentimentType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Smile, Heart, Image, Link2, Bold, Italic, Heading2, List, AlignLeft, AlignCenter, AlignRight, Settings2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JournalEntryProps {
  mood: MoodType | null;
  onSave: (journalText: string, sentiment: SentimentType) => Promise<void>;
  isSubmitting: boolean;
}

// Font options
const fontOptions = [
  { value: "font-sans", label: "Sans Serif" },
  { value: "font-serif", label: "Serif" },
  { value: "font-mono", label: "Monospace" }
];

// Prompt suggestions based on mood
const promptSuggestions = {
  "Happy": [
    "What made you happy today?",
    "Describe a moment that brought you joy",
    "What are you grateful for right now?",
    "What accomplishment are you proud of today?"
  ],
  "Neutral": [
    "How was your day overall?",
    "What was the most interesting part of your day?",
    "What's something you observed today?",
    "What's been on your mind lately?"
  ],
  "Sad": [
    "What's causing you to feel down today?",
    "How might you be kind to yourself right now?",
    "What would help you feel better?",
    "What would you like to express about how you're feeling?"
  ],
  "Angry": [
    "What triggered this feeling?",
    "What would help you process this emotion?",
    "What can you learn from this situation?",
    "How might you respond differently next time?"
  ],
  "Tired": [
    "What's draining your energy?",
    "How might you restore yourself?",
    "What boundaries might you need to set?",
    "What would help you feel more rested?"
  ]
};

export default function JournalEntry({ mood, onSave, isSubmitting }: JournalEntryProps) {
  const [journalText, setJournalText] = useState("");
  const [title, setTitle] = useState("Today's Entry");
  const [sentiment, setSentiment] = useState<SentimentType>("Neutral");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journalMode, setJournalMode] = useState<"write" | "format" | "settings">("write");
  const [fontFamily, setFontFamily] = useState("font-sans");
  const [textAlign, setTextAlign] = useState("text-left");
  const [editorHeight, setEditorHeight] = useState(200);
  const [showPrompts, setShowPrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { toast } = useToast();
  const maxLength = 1000;
  
  // Analyze sentiment when journal text changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (journalText.trim().length > 10) {
        analyzeSentiment(journalText);
      }
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }, [journalText]);
  
  async function analyzeSentiment(text: string) {
    if (text.trim().length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest(
        "GET", 
        `/api/analyze-sentiment?text=${encodeURIComponent(text)}`,
      );
      const data = await response.json();
      setSentiment(data.sentiment);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      // Use default sentiment in case of error
      setSentiment("Neutral");
    } finally {
      setIsAnalyzing(false);
    }
  }
  
  const handleSave = async () => {
    if (!journalText.trim()) {
      toast({
        title: "Missing journal entry",
        description: "Please write something in your journal before saving.",
        variant: "destructive"
      });
      return;
    }
    
    if (!mood) {
      toast({
        title: "Missing mood",
        description: "Please select a mood before saving your entry.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await onSave(journalText, sentiment);
      // Clear journal text after successful save
      setJournalText("");
      setTitle("Today's Entry");
    } catch (error) {
      console.error("Error saving journal entry:", error);
    }
  };

  const insertTextAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + textToInsert + text.substring(end);
    setJournalText(newText);
    
    // Focus the textarea and set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + textToInsert.length;
      textarea.selectionEnd = start + textToInsert.length;
    }, 0);
  };

  const formatText = (formatType: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = "";
    
    switch(formatType) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "heading":
        formattedText = `\n## ${selectedText}\n`;
        break;
      case "list":
        formattedText = `\n- ${selectedText.split('\n').join('\n- ')}\n`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setJournalText(newText);
  };

  const usePrompt = (prompt: string) => {
    setJournalText((prev) => prev + (prev ? "\n\n" : "") + prompt);
    setShowPrompts(false);
    
    // Focus the textarea and scroll to the end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 0);
  };

  const getPromptsForMood = () => {
    if (!mood) return promptSuggestions.Neutral;
    return promptSuggestions[mood] || promptSuggestions.Neutral;
  };
  
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-0">
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-medium border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Give your entry a title..."
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">
              {formatDate(new Date())}
            </span>
            
            <div className="flex items-center space-x-2">
              {mood && (
                <div 
                  className="px-2 py-1 rounded text-xs flex items-center gap-1"
                  style={{ background: `${getMoodColor(mood)}30`, color: getMoodColor(mood) }}
                >
                  <Smile size={14} />
                  <span>{mood}</span>
                </div>
              )}
              
              <div 
                className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-gray-100 dark:bg-gray-800"
              >
                <Heart size={14} className={sentiment === "Positive" ? "text-pink-500" : sentiment === "Negative" ? "text-red-500" : "text-gray-500"} />
                {isAnalyzing ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing
                  </span>
                ) : (
                  <span>{sentiment}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-1">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
            <div className="w-full border-b border-gray-200 dark:border-gray-700 flex">
            <button 
              className={`px-4 py-2 border-b-2 ${journalMode === 'write' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'} transition-colors`}
              onClick={() => setJournalMode('write')}
            >
              Write
            </button>
            <button 
              className={`px-4 py-2 border-b-2 ${journalMode === 'format' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'} transition-colors`}
              onClick={() => setJournalMode('format')}
            >
              Format
            </button>
            <button 
              className={`px-4 py-2 border-b-2 ${journalMode === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'} transition-colors`}
              onClick={() => setJournalMode('settings')}
            >
              Settings
            </button>
          </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPrompts(!showPrompts)}
              className="ml-auto h-9 w-9 mr-1"
              title="Writing prompts"
            >
              <Heading2 size={18} className="text-muted-foreground" />
            </Button>
          </div>

          {journalMode === 'write' && (
            <div className="pt-2 pb-0 px-0 mt-0">
              {showPrompts && mood && (
                <div className="mb-3 bg-muted/50 p-3 rounded-md animate-in fade-in duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Writing Prompts</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setShowPrompts(false)}
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {getPromptsForMood().map((prompt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="h-auto py-2 px-3 justify-start text-sm font-normal text-left whitespace-normal hover:bg-muted"
                        onClick={() => usePrompt(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  className={`w-full border-0 p-4 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[${editorHeight}px] resize-y ${fontFamily} ${textAlign}`}
                  placeholder="Write about your day, thoughts, and feelings..."
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  maxLength={maxLength}
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/60 px-2 py-1 rounded-md backdrop-blur-sm">
                  {calculateCharCount(journalText, maxLength)}
                </div>
              </div>
            </div>
          )}

          {journalMode === 'format' && (
            <div className="p-2 mt-0">
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => formatText("bold")}>
                        <Bold size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => formatText("italic")}>
                        <Italic size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => formatText("heading")}>
                        <Heading2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => formatText("list")}>
                        <List size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List</TooltipContent>
                  </Tooltip>
                  
                  <div className="border-l h-8 mx-1 border-gray-200 dark:border-gray-800"></div>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" disabled onClick={() => insertTextAtCursor("[Image Link]")}>
                        <Image size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Image (Premium)</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" disabled onClick={() => insertTextAtCursor("[Link](https://)")}>
                        <Link2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Link (Premium)</TooltipContent>
                  </Tooltip>
                  
                  <div className="border-l h-8 mx-1 border-gray-200 dark:border-gray-800"></div>
                  
                  <ToggleGroup type="single" value={textAlign} onValueChange={(v) => setTextAlign(v || "text-left")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="text-left">
                          <AlignLeft size={16} />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Align Left</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="text-center">
                          <AlignCenter size={16} />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Align Center</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="text-right">
                          <AlignRight size={16} />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Align Right</TooltipContent>
                    </Tooltip>
                  </ToggleGroup>
                </TooltipProvider>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Font Family</label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {journalMode === 'settings' && (
            <div className="p-2 mt-0">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Editor Height</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="range" 
                      min="100" 
                      max="500" 
                      value={editorHeight} 
                      onChange={(e) => setEditorHeight(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">{editorHeight}px</span>
                  </div>
                </div>
                
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    disabled
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} />
                      <span>Advanced Editor Options</span>
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Premium</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
          {/* Word count */}
          <div className="text-xs text-muted-foreground">
            {journalText.trim().split(/\s+/).filter(Boolean).length} words
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || !journalText.trim() || !mood}
            className="animate-button font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Entry</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
