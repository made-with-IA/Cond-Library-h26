import React, { useState } from "react";
import { useListLoans, useReturnLoan, getListLoansQueryKey, getGetLibraryDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, ArrowLeftRight, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { formatDate, getStatusColor, isOverdue } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoans() {
  const [filter, setFilter] = useState<"all" | "overdue" | "due_soon">("all");
  
  const { data, isLoading } = useListLoans({
    limit: 100,
    ...(filter === "overdue" ? { reportStatus: "overdue" as const } : {}),
    ...(filter === "due_soon" ? { dueSoon: true } : {}),
  });
  const returnMutation = useReturnLoan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleReturn = (id: number) => {
    if(!confirm("Confirm book return?")) return;
    returnMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Book returned successfully" });
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLibraryDashboardQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Manage Loans</h1>
        <Link href="/admin/loans/new">
          <Button className="gap-2 bg-primary">
            <Plus size={18} /> New Loan
          </Button>
        </Link>
      </div>

      <Card className="p-4 shadow-sm border-border/50">
        <div className="flex gap-2 mb-6 border-b border-border/50 pb-4 overflow-x-auto">
          <Button 
            variant={filter === "all" ? "primary" : "outline"} 
            size="sm" 
            onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All Active Loans
          </Button>
          <Button 
            variant={filter === "overdue" ? "destructive" : "outline"} 
            size="sm" 
            onClick={() => setFilter("overdue")}
            className={`rounded-full ${filter !== 'overdue' ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 hover:text-red-700' : ''}`}
          >
            Overdue
          </Button>
          <Button 
            variant={filter === "due_soon" ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setFilter("due_soon")}
            className="rounded-full text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100"
          >
            Due in 3 Days
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Book</th>
                <th className="px-6 py-4">Reader</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading loans...</td></tr>
              ) : data?.loans.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No loans found for this filter.</td></tr>
              ) : (
                data?.loans.filter(l => l.status === 'active' || l.status === 'overdue').map(loan => {
                  const overdue = isOverdue(loan.dueDate) || loan.status === 'overdue';
                  return (
                    <tr key={loan.id} className={`transition-colors ${overdue ? 'bg-red-50/30' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-4 font-medium text-foreground line-clamp-2 max-w-[200px]">{loan.book?.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">{loan.user?.name}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                          {overdue ? <AlertTriangle size={14}/> : <Calendar size={14}/>}
                          {formatDate(loan.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={overdue ? 'bg-red-500 text-white border-transparent shadow-sm' : getStatusColor('loan', loan.status)}>
                          {overdue ? 'OVERDUE' : loan.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/loans/${loan.id}`}>
                            <Button variant="ghost" size="sm">Details</Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => handleReturn(loan.id)}
                            isLoading={returnMutation.isPending && returnMutation.variables?.id === loan.id}
                          >
                            <CheckCircle2 size={16} className="mr-1.5" /> Return
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
