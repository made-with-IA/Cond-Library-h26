import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListBooks, useReaderCreateReservation, useReaderReservations, getListBooksQueryKey, getReaderReservationsQueryKey, getReaderDashboardQueryKey } from "@workspace/api-client-react";
import { Search, BookMarked, BookmarkPlus, Hash } from "lucide-react";
import { Card, CardContent, Button, Input, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { getStatusColor } from "@/lib/utils";
import { STRINGS } from "@/lib/constants";

export default function ReaderCatalog() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListBooks({
    search: search || undefined,
    genre: genre || undefined,
    limit: 50,
  });

  const { data: reservationsData } = useReaderReservations();

  const reserveMutation = useReaderCreateReservation();

  const myActiveReservations = (reservationsData?.reservations || []).filter(
    r => r.status === "waiting" || r.status === "notified"
  );

  const reservationByBookId = new Map(
    myActiveReservations.map(r => [r.bookId, r])
  );

  const handleReserve = (bookId: number, title: string) => {
    reserveMutation.mutate(
      { data: { bookId } },
      {
        onSuccess: () => {
          toast({ title: "Reservation successful", description: `You have joined the queue for "${title}".` });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getReaderReservationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getReaderDashboardQueryKey() });
        },
        onError: (err: Error) => {
          toast({ title: "Failed to reserve", description: err.message || "An error occurred.", variant: "destructive" });
        }
      }
    );
  };

  const genres = Array.from(new Set(data?.books.map(b => b.genre).filter(Boolean) || []));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={STRINGS.catalog.searchPlaceholder}
            className="pl-10 h-12 bg-gray-50 border-transparent focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <select
            className="w-full h-12 rounded-xl border border-border bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">{STRINGS.catalog.allGenres}</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-[400px] bg-white rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.books.map(book => {
            const myReservation = reservationByBookId.get(book.id);
            const isPending = reserveMutation.isPending && reserveMutation.variables?.data.bookId === book.id;

            return (
              <Card key={book.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <img src={`${import.meta.env.BASE_URL}images/book-placeholder.png`} alt="Placeholder" className="w-full h-full object-cover opacity-60" />
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <Badge className={getStatusColor('book', book.status)}>{book.status.toUpperCase()}</Badge>
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">{book.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{book.author}</p>
                    <Badge variant="outline" className="text-xs mb-4">{book.genre}</Badge>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    {book.status === 'available' ? (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        {STRINGS.catalog.availableNote}
                      </div>
                    ) : myReservation ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary">
                        <Hash size={14} />
                        <span>{STRINGS.catalog.queuePosition}: <strong>#{myReservation.position}</strong></span>
                      </div>
                    ) : (book.status === 'borrowed' || book.status === 'reserved') ? (
                      <Button
                        variant="secondary"
                        className="w-full gap-2"
                        onClick={() => handleReserve(book.id, book.title)}
                        isLoading={isPending}
                      >
                        <BookmarkPlus size={16} /> {STRINGS.catalog.reserve}
                      </Button>
                    ) : (
                      <Button variant="ghost" className="w-full" disabled>{STRINGS.catalog.unavailable}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {data?.books.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-2xl border border-border border-dashed">
              <BookMarked size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">No books found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
