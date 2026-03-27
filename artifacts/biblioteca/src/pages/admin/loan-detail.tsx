import React from "react";
import { useParams, useLocation } from "wouter";
import { useGetLoan, useReturnLoan, getListLoansQueryKey, getGetLibraryDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, User, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, getStatusColor, isOverdue } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { STRINGS } from "@/lib/constants";

export default function AdminLoanDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loan, isLoading } = useGetLoan(Number(id));
  const returnMutation = useReturnLoan();

  const handleReturn = () => {
    if (!confirm(STRINGS.loanDetail.returnConfirm)) return;
    returnMutation.mutate(
      { id: Number(id) },
      {
        onSuccess: () => {
          toast({ title: STRINGS.loanDetail.returnSuccess });
          queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLibraryDashboardQueryKey() });
          setLocation("/admin/loans");
        },
        onError: () => {
          toast({ title: STRINGS.loanDetail.returnFailed, variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg">{STRINGS.loanDetail.notFound}</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/admin/loans")}>
          <ArrowLeft size={16} className="mr-2" /> {STRINGS.loanDetail.backToLoans}
        </Button>
      </div>
    );
  }

  const overdue = loan.status === "overdue" || (loan.status === "active" && isOverdue(loan.dueDate));
  const isActive = loan.status === "active" || loan.status === "overdue";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/loans")}>
          <ArrowLeft size={16} className="mr-2" /> {STRINGS.loanDetail.backToLoans}
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground flex-1">{STRINGS.loanDetail.loanNumber}{loan.id}</h1>
        {isActive && (
          <Button
            className="gap-2 bg-green-700 hover:bg-green-800 text-white"
            onClick={handleReturn}
            isLoading={returnMutation.isPending}
          >
            <CheckCircle2 size={16} /> {STRINGS.loanDetail.markReturned}
          </Button>
        )}
      </div>

      {overdue && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="font-medium">{STRINGS.loanDetail.overdueWarning} {formatDate(loan.dueDate)}.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs">{STRINGS.loanDetail.bookInfo}</h3>
            <div className="flex gap-4">
              <div className="w-16 h-24 bg-secondary rounded-lg overflow-hidden shrink-0 shadow-sm">
                {loan.book?.imageUrl ? (
                  <img src={loan.book.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <BookOpen size={24} />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">{loan.book?.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{loan.book?.author}</p>
                {loan.book?.genre && (
                  <Badge variant="outline" className="mt-3 text-xs">{loan.book.genre}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs">{STRINGS.loanDetail.readerInfo}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold">{loan.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{loan.user?.email}</p>
                </div>
              </div>
              {(loan.user?.block || loan.user?.house) && (
                <p className="text-sm text-muted-foreground pl-1">
                  {STRINGS.loanDetail.blockLabel} {loan.user.block}, {STRINGS.loanDetail.houseLabel} {loan.user.house}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/admin/readers/${loan.userId}`)}
              >
                {STRINGS.readerDetail.viewProfile}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider text-xs mb-5">{STRINGS.loanDetail.loanDetails}</h3>
            <div className="grid sm:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                <Badge className={getStatusColor("loan", loan.status)}>{loan.status}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.loanDetail.loanDate}</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar size={14} className="text-primary" />
                  {formatDate(loan.loanDate)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.loanDetail.dueDate}</p>
                <div className={`flex items-center gap-2 text-sm font-medium ${overdue ? "text-red-600" : ""}`}>
                  <Calendar size={14} className={overdue ? "text-red-600" : "text-primary"} />
                  {formatDate(loan.dueDate)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.loanDetail.returnDate}</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar size={14} className="text-primary" />
                  {loan.returnDate ? formatDate(loan.returnDate) : <span className="text-muted-foreground italic">{STRINGS.loanDetail.notReturned}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
