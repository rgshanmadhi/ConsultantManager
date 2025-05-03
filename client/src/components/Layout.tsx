import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  BookOpenText,
  Settings,
  Heart,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  User,
  CreditCard,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Check if trial is ending soon (within 5 days)
  const isTrialEndingSoon = () => {
    if (!user || !user.isInTrial || !user.trialEndDate) return false;
    
    const trialEnd = new Date(user.trialEndDate);
    const today = new Date();
    const diffDays = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays <= 5 && diffDays > 0;
  };
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: <BarChart className="w-5 h-5" /> },
    { name: "Journal", path: "/journal", icon: <BookOpenText className="w-5 h-5" /> },
    { name: "Activities", path: "/games", icon: <Heart className="w-5 h-5" /> },
    { name: "Subscription", path: "/subscription", icon: <CreditCard className="w-5 h-5" /> },
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-primary">Serene</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button 
                  variant={location === item.path ? "default" : "ghost"} 
                  className="w-full justify-start gap-2"
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="mt-auto p-4 border-t">
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-primary">Serene</h1>
          <p className="text-muted-foreground text-sm">Mental Health Tracker</p>
        </div>
        
        <div className="flex flex-col gap-2 p-4">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button 
                variant={location === item.path ? "default" : "ghost"} 
                className="w-full justify-start gap-2"
              >
                {item.icon}
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
        
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Subscription alert banner */}
        {(!user?.isSubscribed && !user?.isInTrial) && (
          <div className="bg-destructive/90 text-destructive-foreground py-2 px-4 text-center">
            <span className="text-sm">
              Your trial has expired. 
              <Link href="/subscription" className="font-medium underline ml-1">
                Subscribe now
              </Link> 
              to continue using all features.
            </span>
          </div>
        )}
        
        {/* Trial ending soon alert */}
        {isTrialEndingSoon() && (
          <div className="bg-amber-500/90 text-amber-950 py-2 px-4 text-center dark:bg-amber-900/90 dark:text-amber-50">
            <span className="text-sm">
              Your free trial is ending soon. 
              <Link href="/subscription" className="font-medium underline ml-1">
                Subscribe now
              </Link> 
              to continue using all features.
            </span>
          </div>
        )}
        
        <div className="max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}