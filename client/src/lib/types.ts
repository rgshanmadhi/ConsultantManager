import { MoodType, SentimentType } from "@shared/schema";

export interface CalendarDay {
  day: number;
  mood?: MoodType;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface MoodFrequency {
  mood: MoodType;
  count: number;
  percentage: number;
}

export interface MoodData {
  [key: string]: { count: number };
}
