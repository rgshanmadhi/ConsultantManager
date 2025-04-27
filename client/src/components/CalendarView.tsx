import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths
} from "date-fns";
import { MoodType, Entry } from "@shared/schema";
import { CalendarDay } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  entries: Entry[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export default function CalendarView({ entries, onSelectDate, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth, entries]);
  
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const calendarDays: CalendarDay[] = days.map(day => {
      // Find an entry for this day
      const dayEntries = entries.filter(entry => 
        isSameDay(new Date(entry.date), day)
      );
      
      // Use the first entry's mood if available
      const dayMood = dayEntries.length > 0 
        ? dayEntries[0].mood as MoodType 
        : undefined;
      
      return {
        day: day.getDate(),
        date: day,
        mood: dayMood,
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isSameDay(day, new Date())
      };
    });
    
    setCalendarDays(calendarDays);
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex space-x-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-sm text-gray-500 dark:text-gray-400">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => (
            <div
              key={i}
              onClick={() => day.isCurrentMonth && onSelectDate(day.date)}
              className={`calendar-day h-10 flex items-center justify-center cursor-pointer 
                ${day.isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''} 
                ${isSameDay(day.date, selectedDate) ? 'bg-primary bg-opacity-10 font-bold' : ''} 
                ${day.isToday ? 'font-bold' : ''}
                ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                ${day.mood ? day.mood.toLowerCase() : ''}
                rounded-full`}
            >
              {day.day}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#FFD700] mr-1"></span>
            <span>Happy</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#A9A9A9] mr-1"></span>
            <span>Neutral</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#6495ED] mr-1"></span>
            <span>Sad</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#FF6347] mr-1"></span>
            <span>Angry</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#8A2BE2] mr-1"></span>
            <span>Tired</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
