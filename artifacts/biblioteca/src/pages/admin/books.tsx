import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListBooks, useDeleteBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, BookOpen } from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminBooks() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListBooks({ search: search || undefined, limit: 100 });
  const deleteMutation = useDeleteBook();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDelete = (id: number, title: string) => {
    if(!confirm(`Are you sure you want to delete "${title}"? This will fail if it has loan history.`)) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Book deleted" });
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Manage Books</h1>
        <Button onClick={() => setLocation("/admin/books/new")} className="gap-2">
          <Plus size={18} /> Add New Book
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search by title, author, ISBN..." 
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Book</th>
                <th className="px-6 py-4">Genre</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-white">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading catalog...</td></tr>
              ) : data?.books.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No books found.</td></tr>
              ) : (
                data?.books.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 bg-gray-100 rounded shrink-0 flex items-center justify-center overflow-hidden">
                          {book.imageUrl ? <img src={book.imageUrl} alt="" className="w-full h-full object-cover" /> : <BookOpen size={16} className="text-gray-400" />}
                        </div>
                        <div>
                          <Link href={`/admin/books/${book.id}`} className="font-semibold text-primary hover:underline text-base line-clamp-1">{book.title}</Link>
                          <p className="text-muted-foreground line-clamp-1">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{book.genre}</td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor('book', book.status)}>{book.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/books/${book.id}/edit`)}>
                          <Edit2 size={16} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id, book.title)}>
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
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
