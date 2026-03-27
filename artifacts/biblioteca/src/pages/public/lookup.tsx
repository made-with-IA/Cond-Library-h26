import React, { useState } from "react";
import { useReaderLookup } from "@workspace/api-client-react";
import { BookOpen, Search, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, Button, Input, Badge } from "@/components/ui";
import { formatDate, isOverdue, getStatusColor } from "@/lib/utils";
import { STRINGS } from "@/lib/constants";

export default function Lookup() {
  const [email, setEmail] = useState("");
  const lookupMutation = useReaderLookup();
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    lookupMutation.mutate({ data: { email } });
    setSearched(true);
  };

  const data = lookupMutation.data;
  const isError = lookupMutation.isError;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 py-20 bg-gray-50/50 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-2xl text-center mb-10">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-white shadow-lg border border-border/50 text-primary mb-6">
          <Search size={32} />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">{STRINGS.lookup.title}</h1>
        <p className="text-muted-foreground text-lg">{STRINGS.lookup.subtitle}</p>
      </div>

      <Card className="w-full max-w-2xl border-none shadow-xl shadow-black/5 bg-white/80 backdrop-blur-md">
        <CardContent className="p-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input 
              type="email" 
              placeholder={STRINGS.lookup.placeholder}
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="h-14 text-base bg-white"
              required
            />
            <Button type="submit" size="lg" isLoading={lookupMutation.isPending} className="px-8 h-14 shrink-0">
              {STRINGS.lookup.buttonLabel}
            </Button>
          </form>

          {isError && searched && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p>No reader found with this email, or an error occurred.</p>
            </div>
          )}

          {data && (
            <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center pb-6 border-b border-border/50">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Reader Found</p>
                <h3 className="text-2xl font-bold">{data.user.name}</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-primary" /> Active Loans ({data.activeLoans.length + data.overdueLoans.length})
                  </h4>
                  {data.activeLoans.length === 0 && data.overdueLoans.length === 0 ? (
                    <p className="text-muted-foreground italic text-sm">No active loans.</p>
                  ) : (
                    <div className="space-y-3">
                      {[...data.overdueLoans, ...data.activeLoans].map(loan => {
                        const overdue = isOverdue(loan.dueDate) || loan.status === 'overdue';
                        return (
                          <div key={loan.id} className={`flex items-center justify-between p-4 rounded-xl border ${overdue ? 'bg-red-50/50 border-red-200' : 'bg-white border-border/50 shadow-sm'}`}>
                            <div>
                              <p className="font-medium">{loan.book?.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Calendar size={14} />
                                <span className={overdue ? "text-red-600 font-medium" : ""}>
                                  Due: {formatDate(loan.dueDate)}
                                </span>
                              </div>
                            </div>
                            {overdue && <Badge className="bg-red-500 text-white border-transparent shadow-sm">OVERDUE</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-primary" /> Reservations ({data.reservations.length})
                  </h4>
                  {data.reservations.length === 0 ? (
                    <p className="text-muted-foreground italic text-sm">No active reservations.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.reservations.map(res => (
                        <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-border/50 shadow-sm">
                          <div>
                            <p className="font-medium">{res.book?.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">Queue Position: <span className="font-bold text-foreground">{res.position}</span></p>
                          </div>
                          <Badge className={getStatusColor('reservation', res.status)}>{res.status.toUpperCase()}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
