import React from "react";
import { useParams, Link } from "wouter";
import { useGetBook } from "@workspace/api-client-react";
import { ArrowLeft, Edit2, Calendar, User, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { formatDate, getStatusColor } from "@/lib/utils";

export default function AdminBookDetail() {
  const { id } = useParams();
  const { data: book, isLoading } = useGetBook(Number(id));

  if (isLoading || !book) return <div className="p-10 animate-pulse bg-white rounded-2xl h-96 border border-border"></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/books">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-border/50">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Book Details</h1>
        </div>
        <Link href={`/admin/books/${book.id}/edit`}>
          <Button variant="outline" className="gap-2 bg-white">
            <Edit2 size={16} /> Edit
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-black/5 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 lg:w-1/4 bg-secondary/50 p-8 flex items-center justify-center border-r border-border/50">
            <div className="w-full max-w-[200px] aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-white">
               {book.imageUrl ? <img src={book.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200"></div>}
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center">
            <Badge className={`w-fit mb-4 ${getStatusColor('book', book.status)} text-sm px-3 py-1`}>{book.status.toUpperCase()}</Badge>
            <h2 className="text-4xl font-display font-bold mb-2 leading-tight text-primary">{book.title}</h2>
            <p className="text-xl text-muted-foreground mb-6 font-medium">{book.author}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Genre</p>
                <p className="font-medium text-foreground">{book.genre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Published</p>
                <p className="font-medium text-foreground">{book.publishedYear || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ISBN</p>
                <p className="font-medium text-foreground">{book.isbn || "—"}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Synopsis</h4>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{book.description || "No description available."}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border/50">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-display font-bold text-xl">Recent Loan History</h3>
          </div>
          <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            {book.loans?.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground italic">No loan history for this book.</p>
            ) : (
              book.loans?.map(loan => (
                <div key={loan.id} className="p-5 hover:bg-gray-50/50 flex justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                      <User size={16} className="text-primary/70" /> {loan.user?.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={14} /> Out: {formatDate(loan.loanDate)}</span>
                      {loan.returnDate && <span className="flex items-center gap-1 text-green-700"><CheckCircle2 size={14} /> In: {formatDate(loan.returnDate)}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor('loan', loan.status)}>{loan.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="shadow-sm border-border/50">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-display font-bold text-xl">Reservation Queue</h3>
          </div>
          <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
             {book.reservations?.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground italic">No active reservations.</p>
            ) : (
              book.reservations?.filter(r => r.status === 'waiting' || r.status === 'notified')
                .sort((a,b) => a.position - b.position)
                .map(res => (
                <div key={res.id} className="p-5 hover:bg-gray-50/50 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {res.position}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{res.user?.name}</p>
                      <p className="text-xs text-muted-foreground">Since {formatDate(res.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor('reservation', res.status)}>{res.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
