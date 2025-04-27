import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { MoodType, SentimentType } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export function getMoodEmoji(mood: MoodType): string {
  const moodEmojis: Record<MoodType, string> = {
    Happy: "😊",
    Neutral: "😐",
    Sad: "😢",
    Angry: "😠",
    Tired: "😴"
  };
  
  return moodEmojis[mood];
}

export function getSentimentIcon(sentiment: SentimentType): string {
  const sentimentIcons: Record<SentimentType, string> = {
    Positive: "sentiment_satisfied",
    Neutral: "sentiment_neutral",
    Negative: "sentiment_dissatisfied"
  };
  
  return sentimentIcons[sentiment];
}

export function getMoodColor(mood: MoodType): string {
  const moodColors: Record<MoodType, string> = {
    Happy: "text-[#FFD700]",
    Neutral: "text-[#A9A9A9]",
    Sad: "text-[#6495ED]",
    Angry: "text-[#FF6347]",
    Tired: "text-[#8A2BE2]"
  };
  
  return moodColors[mood];
}

export function getMoodBgColor(mood: MoodType): string {
  const moodBgColors: Record<MoodType, string> = {
    Happy: "bg-[#FFD700] bg-opacity-10",
    Neutral: "bg-[#A9A9A9] bg-opacity-10",
    Sad: "bg-[#6495ED] bg-opacity-10",
    Angry: "bg-[#FF6347] bg-opacity-10",
    Tired: "bg-[#8A2BE2] bg-opacity-10"
  };
  
  return moodBgColors[mood];
}

export function getSentimentColor(sentiment: SentimentType): string {
  const sentimentColors: Record<SentimentType, string> = {
    Positive: "text-[#FFD700]",
    Neutral: "text-[#A9A9A9]",
    Negative: "text-[#6495ED]"
  };
  
  return sentimentColors[sentiment];
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function calculateCharCount(text: string, maxLength: number = 1000): string {
  return `${text.length}/${maxLength} characters`;
}
