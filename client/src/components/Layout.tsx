import React, { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  LineChart, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  User, 
  CreditCard
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Journal", path: "/journal", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Calendar", path: "/calendar", icon: <Calendar className="h-5 w-5" /> },
    { name: "Analytics", path: "/analytics", icon: <LineChart className="h-5 w-5" /> },
  ];

  // Get initials for avatar
  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.username.substring(0, 2).toUpperCase() || "U";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop Navigation */}
      <header className="bg-white dark:bg-gray-900 border-b shadow-sm h-16 hidden md:flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Serene
          </h1>
        </div>
        
        <nav className="flex-1 flex justify-center">
          <ul className="flex space-x-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant={location === item.path ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.name || user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscription">
                  <div className="flex items-center gap-2 w-full">
                    <CreditCard className="h-4 w-4" />
                    <span>Subscription</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                disabled={logoutMutation.isPending}
                className="text-red-500 focus:text-red-500"
              >
                <div className="flex items-center gap-2 w-full">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <header className="bg-white dark:bg-gray-900 border-b shadow-sm h-16 flex md:hidden items-center justify-between px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Serene
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </div>
      </header>
      
      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white dark:bg-gray-900 h-full w-64 flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <h2 className="font-bold text-lg">Menu</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Close menu"
                onClick={toggleMobileMenu}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex flex-col p-4 space-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name || user.username}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={location === item.path ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={toggleMobileMenu}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  </Button>
                </Link>
              ))}
              
              <Separator className="my-2" />
              
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                </Button>
              </Link>
              
              <Link href="/subscription">
                <Button variant="ghost" className="w-full justify-start">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5" />
                    <span>Subscription</span>
                  </div>
                </Button>
              </Link>
              
              <Separator className="my-2" />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Serene. All rights reserved.</p>
      </footer>
    </div>
  );
}