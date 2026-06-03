import { Link, useLocation } from "wouter";
import { Users, FileText, Banknote, LayoutDashboard, Menu, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farmers", label: "Farmers", icon: Users },
  { href: "/loan-applications", label: "Applications", icon: FileText },
  { href: "/loans", label: "Loans", icon: Banknote },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <nav className={`flex flex-col gap-2 ${className}`}>
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className="w-full">
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-shrink-0">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6 gap-2">
          <div className="bg-primary-foreground text-primary rounded-md p-1">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">AgriPride</span>
        </div>
        <div className="flex-1 overflow-auto py-6 px-4">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          AgriPride Mkopo v1.0
        </div>
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm z-10 sticky top-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0 border-r-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-16 items-center border-b border-sidebar-border px-6 gap-2">
                <div className="bg-primary-foreground text-primary rounded-md p-1">
                  <Sprout className="h-5 w-5" />
                </div>
                <span className="font-bold tracking-tight text-lg">AgriPride</span>
              </div>
              <div className="p-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                MK
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}