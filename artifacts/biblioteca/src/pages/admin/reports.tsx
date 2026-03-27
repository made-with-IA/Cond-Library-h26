import React, { useState, useMemo } from "react";
import { useListLoans } from "@workspace/api-client-react";
import { Download, Filter } from "lucide-react";
import { Card, Button, Input, Label } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { STRINGS } from "@/lib/constants";
import Papa from "papaparse";

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [readerSearch, setReaderSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useListLoans({ limit: 1000 });

  const loans = data?.loans || [];

  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (readerSearch && !l.user?.name.toLowerCase().includes(readerSearch.toLowerCase()) && !l.user?.email.toLowerCase().includes(readerSearch.toLowerCase())) return false;
      if (bookSearch && !l.book?.title.toLowerCase().includes(bookSearch.toLowerCase())) return false;
      if (dateFrom && l.loanDate < dateFrom) return false;
      if (dateTo && l.loanDate > dateTo) return false;
      return true;
    });
  }, [loans, statusFilter, readerSearch, bookSearch, dateFrom, dateTo]);

  const handleExport = () => {
    const csvData = filteredLoans.map(l => ({
      "Loan ID": l.id,
      "Book Title": l.book?.title ?? "",
      "Author": l.book?.author ?? "",
      "Reader Name": l.user?.name ?? "",
      "Reader Email": l.user?.email ?? "",
      "Unit": `${l.user?.block ?? ""} ${l.user?.house ?? ""}`.trim(),
      "Status": l.status,
      "Loan Date": formatDate(l.loanDate),
      "Due Date": formatDate(l.dueDate),
      "Return Date": l.returnDate ? formatDate(l.returnDate) : "Not returned",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `library_report_${formatDate(new Date().toISOString())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">{STRINGS.reports.title}</h1>
        <Button onClick={handleExport} className="gap-2 bg-green-700 hover:bg-green-800 text-white" disabled={filteredLoans.length === 0}>
          <Download size={18} /> {STRINGS.reports.exportCsv} ({filteredLoans.length})
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Filter size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{STRINGS.reports.filters}</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.reports.statusFilter}</Label>
            <select
              className="w-full border border-border rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:border-primary bg-gray-50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.reports.readerFilter}</Label>
            <Input
              placeholder="Search by name or email..."
              value={readerSearch}
              onChange={e => setReaderSearch(e.target.value)}
              className="h-10 bg-gray-50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.reports.bookFilter}</Label>
            <Input
              placeholder="Search by book title..."
              value={bookSearch}
              onChange={e => setBookSearch(e.target.value)}
              className="h-10 bg-gray-50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{STRINGS.reports.dateRange}</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="h-10 bg-gray-50 text-sm flex-1"
                title="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="h-10 bg-gray-50 text-sm flex-1"
                title="To"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/50 max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4">Book</th>
                <th className="px-6 py-4">Reader</th>
                <th className="px-6 py-4">Loan Date</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Return Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Generating report...</td></tr>
              ) : filteredLoans.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records match the selected filters.</td></tr>
              ) : (
                filteredLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium max-w-[160px]">
                      <p className="truncate">{loan.book?.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{loan.book?.author}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <p>{loan.user?.name}</p>
                      <p className="text-xs">{loan.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(loan.loanDate)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(loan.dueDate)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{loan.returnDate ? formatDate(loan.returnDate) : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`uppercase text-xs font-bold tracking-wider px-2 py-1 rounded-full ${
                        loan.status === "overdue" ? "bg-red-100 text-red-700" :
                        loan.status === "returned" ? "bg-green-100 text-green-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{loan.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
