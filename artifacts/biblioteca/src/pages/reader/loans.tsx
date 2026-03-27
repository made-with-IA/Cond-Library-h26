import React from "react";
import { useReaderLoans } from "@workspace/api-client-react";
import { BookOpen, Calendar, AlertTriangle, CheckCircle2, History } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { formatDate, isOverdue } from "@/lib/utils";

export default function ReaderLoans() {
  const { data, isLoading } = useReaderLoans();

  if (isLoading) return <div className="animate-pulse h-64 bg-white rounded-2xl border border-border" />;

  const activeLoans = data?.active || [];
  const historyLoans = data?.history || [];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
          <BookOpen className="text-primary" /> Active Loans ({activeLoans.length})
        </h2>
        
        {activeLoans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border border-dashed p-10 text-center text-muted-foreground">
            You don't have any books currently borrowed.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeLoans.map(loan => {
              const overdue = isOverdue(loan.dueDate) || loan.status === 'overdue';
              return (
                <Card key={loan.id} className={overdue ? "border-red-200 bg-red-50/30" : ""}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-16 bg-secondary rounded shrink-0 overflow-hidden shadow-sm">
                         {loan.book?.imageUrl ? <img src={loan.book.imageUrl} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      {overdue ? (
                        <Badge className="bg-red-500 text-white animate-pulse border-transparent">OVERDUE</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">{loan.book?.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{loan.book?.author}</p>
                    
                    <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {overdue ? <AlertTriangle size={16} /> : <Calendar size={16} />}
                      Due: {formatDate(loan.dueDate)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
          <History className="text-primary" /> Loan History
        </h2>
        
        <Card>
          <div className="divide-y divide-border/50">
            {historyLoans.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No loan history available.</div>
            ) : (
              historyLoans.map(loan => (
                <div key={loan.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-14 bg-secondary rounded shrink-0 overflow-hidden opacity-70">
                         {loan.book?.imageUrl ? <img src={loan.book.imageUrl} alt="" className="w-full h-full object-cover grayscale" /> : null}
                      </div>
                    <div>
                      <h4 className="font-medium text-foreground">{loan.book?.title}</h4>
                      <p className="text-sm text-muted-foreground">Borrowed: {formatDate(loan.loanDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg shrink-0">
                    <CheckCircle2 size={16} />
                    Returned {formatDate(loan.returnDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
