import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3Icon,
  BookIcon,
  HomeIcon,
  LogOutIcon, 
  UserIcon,
  CreditCardIcon,
  HeartPulseIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Journal", href: "/journal", icon: BookIcon },
    { name: "Activities", href: "/games", icon: HeartPulseIcon },
    { name: "Insights", href: "/insights", icon: BarChart3Icon },
    { name: "Subscription", href: "/subscription", icon: CreditCardIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Nav */}
      <header className="bg-background sticky top-0 z-30 border-b flex lg:hidden items-center h-14 px-4">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="font-bold text-xl text-primary">
            Serene
          </Link>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-6 mt-8">
                <Link 
                  href="/" 
                  className="font-bold text-xl flex items-center"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-primary">Serene</span>
                </Link>
                
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      <Button 
                        variant={item.href === location ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                </div>
                
                <div className="pt-2 mt-auto">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                  >
                    <LogOutIcon className="h-5 w-5 mr-3" />
                    Log out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Nav */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex border-r w-64 flex-col fixed z-20 inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <Link 
              href="/" 
              className="font-bold text-xl flex items-center h-10 mb-8"
            >
              <span className="text-primary">Serene</span>
            </Link>
            
            <nav className="flex-1 space-y-1.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                >
                  <div
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      item.href === location
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>
            
            <div className="pt-2 mt-auto border-t">
              <div className="px-3 py-2 mt-2">
                <div className="flex items-center mb-3">
                  <div className="rounded-full bg-secondary h-10 w-10 flex items-center justify-center">
                    <span className="font-medium text-secondary-foreground">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.name || user?.username}</p>
                    {user?.isSubscribed ? (
                      <span className="text-xs text-green-600 font-medium">Active subscription</span>
                    ) : user?.isInTrial ? (
                      <span className="text-xs text-amber-600 font-medium">Trial mode</span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">Trial expired</span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOutIcon className="h-5 w-5 mr-3" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        </aside>
        
        <main className="flex-1 lg:pl-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}