import React, { useState } from "react";
import { useLocation } from "wouter";
import { useListUsers, useListBooks, useCreateLoan, getListLoansQueryKey, getGetLibraryDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, Check, BookOpen, User, Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Input, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

export default function AdminNewLoan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");

  const { data: usersData } = useListUsers({ search: userSearch || undefined, limit: 5 });
  const { data: booksData } = useListBooks({ search: bookSearch || undefined, status: "available", limit: 5 });
  
  const createMutation = useCreateLoan();

  const handleCreate = () => {
    if (!selectedUser || !selectedBook) return;
    createMutation.mutate({ data: { userId: selectedUser, bookId: selectedBook } }, {
      onSuccess: () => {
        toast({ title: "Loan created successfully" });
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLibraryDashboardQueryKey() });
        setLocation("/admin/loans");
      },
      onError: (err) => {
        toast({ title: "Error creating loan", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/loans")} className="rounded-full bg-white shadow-sm border border-border/50">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">Register New Loan</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Step 1: Select Reader */}
        <Card className={`border-2 transition-colors ${selectedUser ? 'border-primary shadow-md shadow-primary/5' : 'border-border/50'}`}>
          <div className="p-6 border-b border-border/50 bg-secondary/30 flex items-center gap-3">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedUser ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500'}`}>1</div>
             <h2 className="text-xl font-display font-semibold">Select Reader</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            {selectedUser ? (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><User size={20} /></div>
                  <div>
                    <p className="font-medium text-foreground">{usersData?.users.find(u => u.id === selectedUser)?.name || 'Selected Reader'}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedUser}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input placeholder="Search reader by name..." className="pl-10" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                </div>
                <div className="border border-border/50 rounded-xl max-h-[300px] overflow-y-auto divide-y divide-border/50">
                  {usersData?.users.filter(u => u.status === 'active').map(user => (
                    <div key={user.id} onClick={() => setSelectedUser(user.id)} className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors">
                      <div>
                        <p className="font-medium text-sm text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Plus size={16} className="text-muted-foreground" />
                    </div>
                  ))}
                  {usersData?.users.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No active readers found.</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Book */}
        <Card className={`border-2 transition-colors ${selectedBook ? 'border-primary shadow-md shadow-primary/5' : 'border-border/50'} ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="p-6 border-b border-border/50 bg-secondary/30 flex items-center gap-3">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedBook ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500'}`}>2</div>
             <h2 className="text-xl font-display font-semibold">Select Book</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            {selectedBook ? (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><BookOpen size={20} /></div>
                  <div>
                    <p className="font-medium text-foreground line-clamp-1">{booksData?.books.find(b => b.id === selectedBook)?.title || 'Selected Book'}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedBook}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>Change</Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input placeholder="Search available books..." className="pl-10" value={bookSearch} onChange={e => setBookSearch(e.target.value)} />
                </div>
                <div className="border border-border/50 rounded-xl max-h-[300px] overflow-y-auto divide-y divide-border/50">
                  {booksData?.books.map(book => (
                    <div key={book.id} onClick={() => setSelectedBook(book.id)} className="p-3 hover:bg-gray-50 cursor-pointer flex gap-3 transition-colors">
                       <div className="w-8 h-12 bg-secondary rounded shrink-0 overflow-hidden">
                          {book.imageUrl && <img src={book.imageUrl} alt="" className="w-full h-full object-cover" />}
                       </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground line-clamp-1">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                      <Plus size={16} className="text-muted-foreground mt-2 shrink-0" />
                    </div>
                  ))}
                  {booksData?.books.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No available books found.</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {selectedUser && selectedBook && (
        <Card className="bg-primary text-primary-foreground border-transparent shadow-xl animate-in slide-in-from-bottom-4">
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><CheckCircle2 /> Ready to Register</h3>
              <p className="text-primary-foreground/80 text-sm">A 15-day loan period will be set automatically.</p>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
            >
              Confirm Registration
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
}
