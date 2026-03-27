import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetUser, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Mail, Phone, Home, Calendar, BookOpen, Trash2 } from "lucide-react";
import { Card, CardContent, Button, Badge, Select, Label } from "@/components/ui";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { STRINGS } from "@/lib/constants";
import type { UserStatus } from "@workspace/api-client-react";

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "active", label: STRINGS.common.active },
  { value: "pending", label: STRINGS.readerDetail.statusPending },
  { value: "inactive", label: STRINGS.common.inactive },
  { value: "blocked", label: STRINGS.readerDetail.statusBlocked },
];

export default function AdminReaderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reader, isLoading } = useGetUser(Number(id));
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [selectedStatus, setSelectedStatus] = useState<UserStatus | "">("");

  const currentStatus = selectedStatus || (reader?.status ?? "");

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status as UserStatus);
    updateMutation.mutate(
      { id: Number(id), data: { status: status as UserStatus } },
      {
        onSuccess: () => {
          toast({ title: STRINGS.readerDetail.statusUpdated, description: `${STRINGS.readerDetail.statusChangedTo} ${status}.` });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: () => {
          toast({ title: STRINGS.readerDetail.statusUpdateFailed, variant: "destructive" });
          setSelectedStatus("");
        }
      }
    );
  };

  const handleDelete = () => {
    if (!confirm(STRINGS.readerDetail.deleteConfirm)) return;
    deleteMutation.mutate(
      { id: Number(id) },
      {
        onSuccess: () => {
          toast({ title: STRINGS.readerDetail.deleteSuccess });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setLocation("/admin/readers");
        },
        onError: () => {
          toast({ title: STRINGS.readerDetail.deleteFailed, variant: "destructive" });
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

  if (!reader) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <User size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg">{STRINGS.readerDetail.notFound}</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/admin/readers")}>
          <ArrowLeft size={16} className="mr-2" /> {STRINGS.readerDetail.backToReaders}
        </Button>
      </div>
    );
  }

  const activeLoans = (reader.loans || []).filter(l => l.status === "active" || l.status === "overdue");
  const loanHistory = (reader.loans || []).filter(l => l.status === "returned");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/readers")}>
          <ArrowLeft size={16} className="mr-2" /> {STRINGS.readerDetail.backToReaders}
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground flex-1">{reader.name}</h1>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
        >
          <Trash2 size={16} className="mr-2" /> {STRINGS.readerDetail.deleteReader}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto">
              <User size={36} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">{reader.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{STRINGS.readerDetail.memberSince} {formatDate(reader.createdAt)}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={16} className="shrink-0" />
                <span className="truncate">{reader.email}</span>
              </div>
              {reader.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone size={16} className="shrink-0" />
                  <span>{reader.phone}</span>
                </div>
              )}
              {(reader.block || reader.house) && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Home size={16} className="shrink-0" />
                  <span>{STRINGS.readerDetail.block} {reader.block}, {STRINGS.readerDetail.house} {reader.house}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/50 space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.readerDetail.accountStatus}</Label>
              <Select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateMutation.isPending}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                {STRINGS.readerDetail.activeLoans} ({activeLoans.length})
              </h3>
              {activeLoans.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">{STRINGS.readerDetail.noActiveLoans}</p>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map(loan => {
                    const overdue = loan.status === "overdue";
                    return (
                      <div key={loan.id} className={`flex items-center justify-between p-4 rounded-xl border ${overdue ? "bg-red-50/50 border-red-200" : "bg-gray-50/50 border-border/50"}`}>
                        <div>
                          <p className="font-medium">{loan.book?.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{loan.book?.author}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Calendar size={12} className="text-muted-foreground" />
                            <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                              Due {formatDate(loan.dueDate)}
                            </span>
                          </div>
                          <Badge className={getStatusColor("loan", loan.status)}>{loan.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                {STRINGS.readerDetail.loanHistory} ({loanHistory.length})
              </h3>
              {loanHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">{STRINGS.readerDetail.noLoanHistory}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase border-b border-border/50">
                        <th className="py-2 text-left font-medium">Book</th>
                        <th className="py-2 text-left font-medium">Borrowed</th>
                        <th className="py-2 text-left font-medium">Returned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {loanHistory.map(loan => (
                        <tr key={loan.id}>
                          <td className="py-3 font-medium">{loan.book?.title}</td>
                          <td className="py-3 text-muted-foreground">{formatDate(loan.loanDate)}</td>
                          <td className="py-3 text-muted-foreground">{loan.returnDate ? formatDate(loan.returnDate) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
