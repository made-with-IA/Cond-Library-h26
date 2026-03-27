import React from "react";
import { Link } from "wouter";
import { useGetLibraryDashboard, useListNotes } from "@workspace/api-client-react";
import { BookOpen, Users, Clock, ArrowRight, Info, AlertTriangle, MessageSquare } from "lucide-react";
import { STRINGS } from "@/lib/constants";
import { Card, CardContent, Button, Badge } from "@/components/ui";

export default function Home() {
  const { data: dashboard, isLoading: loadingDash } = useGetLibraryDashboard();
  const { data: notesResp, isLoading: loadingNotes } = useListNotes();

  const notes = notesResp?.notes || [];
  const announcements = notes.filter(n => n.type === 'announcement' && n.active);
  const rules = notes.filter(n => n.type === 'rule' && n.active);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-secondary/30 -z-10" />
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary font-medium">
              <span className="flex w-2 h-2 rounded-full bg-primary mr-2"></span>
              Your Community Library
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-[1.1] text-foreground">
              {STRINGS.home.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {STRINGS.home.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/reader/catalog" className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 px-6 text-base">
                Browse Catalog
              </Link>
              <Link href="/reader" className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border-2 border-border bg-white hover:border-primary hover:text-primary h-12 px-6 text-base">
                Check My Loans
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10 border-8 border-white">
              <img 
                src={`${import.meta.env.BASE_URL}images/library-hero.png`} 
                alt="Beautiful library interior" 
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-border/50 animate-in slide-in-from-bottom-8 duration-700 delay-300">
              <div className="flex items-center gap-4">
                <div className="bg-accent/20 p-3 rounded-xl text-accent-foreground">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Books</p>
                  <p className="text-2xl font-bold font-display">{loadingDash ? "..." : dashboard?.availableBooks || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard icon={<BookOpen />} label={STRINGS.home.stats.books} value={dashboard?.totalBooks} loading={loadingDash} />
            <StatCard icon={<BookOpen className="text-green-600" />} label={STRINGS.home.stats.available} value={dashboard?.availableBooks} loading={loadingDash} />
            <StatCard icon={<Users className="text-blue-600" />} label={STRINGS.home.stats.readers} value={dashboard?.activeReaders} loading={loadingDash} />
            <StatCard icon={<Clock className="text-orange-600" />} label={STRINGS.home.stats.loans} value={dashboard?.activeLoans} loading={loadingDash} />
          </div>
        </div>
      </section>

      {/* Main Content Grid: Popular Books & Announcements */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display font-bold">{STRINGS.home.popular}</h2>
              <Link href="/reader/catalog" className="text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            
            {loadingDash ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-72 bg-muted animate-pulse rounded-2xl"></div>)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {dashboard?.popularBooks.slice(0, 6).map(book => (
                  <Link key={book.id} href={`/reader/catalog?search=${encodeURIComponent(book.title)}`} className="group">
                    <Card className="h-full border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white cursor-pointer">
                      <div className="aspect-[3/4] overflow-hidden bg-secondary relative">
                        {book.imageUrl ? (
                          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img src={`${import.meta.env.BASE_URL}images/book-placeholder.png`} alt="Placeholder" className="w-full h-full object-cover opacity-50" />
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge variant="default" className="bg-white/90 text-foreground backdrop-blur-sm shadow-sm">{book.genre}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-1 mt-1">{book.author}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {dashboard?.popularBooks.length === 0 && (
                  <p className="text-muted-foreground italic col-span-full">No popular books yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold">{STRINGS.home.announcements}</h2>
            
            <div className="space-y-6">
              {loadingNotes ? (
                <div className="h-32 bg-muted animate-pulse rounded-2xl"></div>
              ) : (
                <>
                  {announcements.map(note => (
                    <div key={note.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <div className="flex items-start gap-3">
                        <MessageSquare className="text-primary mt-1 shrink-0" size={20} />
                        <div>
                          <h4 className="font-semibold text-lg">{note.title}</h4>
                          <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {rules.length > 0 && (
                    <div className="bg-accent/10 p-6 rounded-2xl border border-accent/20">
                      <div className="flex items-center gap-2 mb-4 text-accent-foreground">
                        <Info size={20} />
                        <h4 className="font-semibold text-lg">Library Rules</h4>
                      </div>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        {rules.map(rule => (
                          <li key={rule.id} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground/50 mt-1.5 shrink-0" />
                            <span>{rule.content}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {notes.length === 0 && (
                    <p className="text-muted-foreground italic">No announcements at this time.</p>
                  )}
                </>
              )}
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string | undefined;
  loading: boolean;
}

function StatCard({ icon, label, value, loading }: StatCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
      ) : (
        <h3 className="text-4xl font-display font-bold text-foreground mb-2">{value || 0}</h3>
      )}
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
