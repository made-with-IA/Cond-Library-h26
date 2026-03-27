import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Search, LogIn, LayoutDashboard, Library, BookMarked, User, Settings, Users, ArrowLeftRight, BellRing, FileText, ShieldAlert, Menu, X, LogOut, Loader2 } from "lucide-react";
import { STRINGS } from "@/lib/constants";
import { useReaderAuth, useAdminAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// --- PUBLIC LAYOUT ---
export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground leading-tight">{STRINGS.app.name}</h1>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" ? "text-primary" : "text-muted-foreground")}>
              {STRINGS.nav.home}
            </Link>
            <Link href="/reader" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/reader" ? "text-primary" : "text-muted-foreground")}>
              {STRINGS.nav.lookup}
            </Link>
            <div className="h-6 w-px bg-border mx-2"></div>
            <Link href="/reader/login" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              {STRINGS.nav.readerLogin}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-white border-t border-border py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <div className="flex justify-center items-center gap-2 mb-4 text-primary opacity-80">
            <BookOpen size={24} />
          </div>
          <p>{STRINGS.app.footer}</p>
          <div className="mt-4">
            <Link href="/admin/login" className="text-xs hover:text-primary transition-colors hover:underline">
              Admin Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SHARED SIDEBAR LAYOUT (For Reader & Admin) ---
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function DashboardLayout({ children, navItems, userType, userName, onLogout }: { 
  children: React.ReactNode, 
  navItems: NavItem[], 
  userType: string,
  userName: string,
  onLogout: () => void 
}) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-border/50 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <span className="font-display font-bold text-lg text-primary truncate">{STRINGS.app.name}</span>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 shrink-0 border-b border-border/50 bg-secondary/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{userType}</p>
          <p className="font-medium text-foreground truncate">{userName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/admin" && item.href !== "/reader");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className={cn("transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/50 shrink-0">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            {userType === "Reader" ? STRINGS.reader.logout : STRINGS.admin.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-8 sticky top-0 z-30 shrink-0">
          <button className="lg:hidden p-2 -ml-2 mr-4 rounded-md text-muted-foreground hover:bg-muted" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="font-display font-medium text-xl text-foreground">
            {navItems.find(i => location.startsWith(i.href) && i.href !== "/admin" && i.href !== "/reader")?.label || userType + " Portal"}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- READER LAYOUT ---
export function ReaderLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useReaderAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/reader/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  
  if (!user) return null;

  const navItems: NavItem[] = [
    { label: STRINGS.reader.dashboard, href: "/reader/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: STRINGS.reader.catalog, href: "/reader/catalog", icon: <Library size={18} /> },
    { label: STRINGS.reader.loans, href: "/reader/loans", icon: <BookMarked size={18} /> },
    { label: STRINGS.reader.reservations, href: "/reader/reservations", icon: <BellRing size={18} /> },
    { label: STRINGS.reader.profile, href: "/reader/profile", icon: <User size={18} /> },
  ];

  return (
    <DashboardLayout 
      userType="Reader" 
      userName={user.name} 
      navItems={navItems} 
      onLogout={() => { logout(); setLocation("/reader/login"); }}
    >
      {children}
    </DashboardLayout>
  );
}

// --- ADMIN LAYOUT ---
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !admin) {
      setLocation("/admin/login");
    }
  }, [isLoading, admin, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  
  if (!admin) return null;

  const navItems: NavItem[] = [
    { label: STRINGS.admin.dashboard, href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: STRINGS.admin.books, href: "/admin/books", icon: <Library size={18} /> },
    { label: STRINGS.admin.readers, href: "/admin/readers", icon: <Users size={18} /> },
    { label: STRINGS.admin.loans, href: "/admin/loans", icon: <ArrowLeftRight size={18} /> },
    { label: STRINGS.admin.reservations, href: "/admin/reservations", icon: <BellRing size={18} /> },
    { label: STRINGS.admin.reports, href: "/admin/reports", icon: <FileText size={18} /> },
    { label: STRINGS.admin.notes, href: "/admin/notes", icon: <ShieldAlert size={18} /> },
    { label: STRINGS.admin.admins, href: "/admin/admins", icon: <Settings size={18} /> },
  ];

  return (
    <DashboardLayout 
      userType="Administrator" 
      userName={admin.name} 
      navItems={navItems} 
      onLogout={() => { logout(); setLocation("/admin/login"); }}
    >
      {children}
    </DashboardLayout>
  );
}
