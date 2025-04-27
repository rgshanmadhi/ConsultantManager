import { useTheme } from "@/lib/theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-primary text-white p-4 shadow-md dark:shadow-gray-900">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-medium flex items-center">
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 17c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4h4v4zm0 0h6c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4h-4v4z"></path>
              <path d="M8 13V6c0-2.2 1.8-4 4-4s4 1.8 4 4v7"></path>
            </svg>
          </span>
          Mental Health Tracker
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
