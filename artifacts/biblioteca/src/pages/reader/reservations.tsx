import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useReaderReservations, useReaderCancelReservation, getReaderReservationsQueryKey } from "@workspace/api-client-react";
import { BellRing, X, Clock, MapPin } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ReaderReservations() {
  const { data, isLoading } = useReaderReservations();
  const cancelMutation = useReaderCancelReservation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCancel = (id: number) => {
    if(!confirm("Are you sure you want to cancel this reservation?")) return;
    cancelMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Reservation cancelled" });
          queryClient.invalidateQueries({ queryKey: getReaderReservationsQueryKey() });
        }
      }
    );
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-white rounded-2xl border border-border" />;

  const reservations = data?.reservations || [];
  
  // Sort: Notified first, then waiting by position, then others
  const sorted = [...reservations].sort((a, b) => {
    if (a.status === 'notified' && b.status !== 'notified') return -1;
    if (b.status === 'notified' && a.status !== 'notified') return 1;
    if (a.status === 'waiting' && b.status === 'waiting') return a.position - b.position;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
          <BellRing className="text-primary" /> My Reservations
        </h1>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border border-dashed p-12 text-center text-muted-foreground flex flex-col items-center">
          <BellRing size={48} className="text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-foreground">Queue is empty</p>
          <p className="mt-1">You have no active reservations.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map(res => (
            <Card key={res.id} className={`overflow-hidden transition-all ${res.status === 'notified' ? 'border-green-300 shadow-md shadow-green-100 ring-1 ring-green-100' : ''}`}>
              <CardContent className="p-0 flex flex-col sm:flex-row">
                
                {/* Left: Book Info */}
                <div className="p-6 flex-1 flex gap-5">
                  <div className="w-16 h-24 bg-secondary rounded shadow-sm overflow-hidden shrink-0">
                    {res.book?.imageUrl && <img src={res.book.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor('reservation', res.status)}>{res.status.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">Reserved {formatDate(res.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1">{res.book?.title}</h3>
                    <p className="text-sm text-muted-foreground">{res.book?.author}</p>
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className={`p-6 sm:w-64 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-border/50 ${res.status === 'notified' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {res.status === 'waiting' && (
                    <div className="text-center mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Queue Position</p>
                      <p className="text-3xl font-display font-bold text-primary">#{res.position}</p>
                    </div>
                  )}
                  {res.status === 'notified' && (
                    <div className="text-center mb-4 text-green-800">
                      <MapPin className="mx-auto mb-2 opacity-80" size={24} />
                      <p className="font-medium text-sm">Ready for pickup!</p>
                      {res.expiresAt && <p className="text-xs mt-1 opacity-80">Expires: {formatDate(res.expiresAt)}</p>}
                    </div>
                  )}
                  {res.status === 'cancelled' && (
                    <div className="text-center mb-4 text-muted-foreground">
                      <p className="font-medium">Cancelled</p>
                    </div>
                  )}
                  {res.status === 'fulfilled' && (
                    <div className="text-center mb-4 text-muted-foreground">
                      <p className="font-medium">Fulfilled</p>
                    </div>
                  )}

                  {(res.status === 'waiting' || res.status === 'notified') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                      onClick={() => handleCancel(res.id)}
                      isLoading={cancelMutation.isPending && cancelMutation.variables?.id === res.id}
                    >
                      <X size={16} className="mr-1" /> Cancel
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
