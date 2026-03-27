import React, { useState } from "react";
import { useListReservations, useUpdateReservation, getListReservationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, X, MessageCircle, ArrowUp, Clock } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { formatDate, generateWhatsAppLink, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { STRINGS } from "@/lib/constants";

export default function AdminReservations() {
  const [tab, setTab] = useState<"active" | "expired" | "waiting" | "history">("active");
  const { data, isLoading } = useListReservations({});
  const actionMutation = useUpdateReservation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  interface NotifyInfo { phone?: string | null; name?: string; bookTitle?: string }

  const handleAction = (id: number, action: "notify" | "cancel" | "fulfill" | "advance", extraInfo?: NotifyInfo) => {
    actionMutation.mutate({ id, data: { action } }, {
      onSuccess: () => {
        toast({ title: STRINGS.reservationsAdmin.actionSuccess });
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });

        if (action === 'notify' && extraInfo?.phone) {
          const msg = STRINGS.reservationsAdmin.whatsAppMsg(extraInfo.name || '', extraInfo.bookTitle || '');
          window.open(generateWhatsAppLink(extraInfo.phone, msg), '_blank');
        }
      },
      onError: (err: Error) => toast({ title: STRINGS.reservationsAdmin.actionFailed, description: err.message, variant: "destructive" })
    });
  };

  const reservations = data?.reservations || [];

  const filtered = reservations.filter(r => {
    if (tab === "active") return r.status === "notified" && (!r.expiresAt || new Date(r.expiresAt) > new Date());
    if (tab === "expired") return r.status === "notified" && r.expiresAt && new Date(r.expiresAt) <= new Date();
    if (tab === "waiting") return r.status === "waiting";
    if (tab === "history") return r.status === "fulfilled" || r.status === "cancelled";
    return true;
  }).sort((a, b) => {
    if (tab === "waiting") return a.position - b.position;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const tabs = [
    { id: "active", label: STRINGS.reservationsAdmin.tabActive },
    { id: "waiting", label: STRINGS.reservations.tabWaiting },
    { id: "expired", label: STRINGS.reservations.tabExpired },
    { id: "history", label: STRINGS.reservations.tabHistory },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">{STRINGS.reservationsAdmin.title}</h1>

      <div className="flex border-b border-border/50 overflow-x-auto hide-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse bg-white rounded-2xl">{STRINGS.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground bg-white rounded-2xl border border-border border-dashed">
            <BellRing size={32} className="mx-auto mb-4 opacity-20" />
            {STRINGS.reservationsAdmin.noReservations}
          </div>
        ) : (
          filtered.map(res => (
            <Card key={res.id} className="overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">

                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                  {res.status === 'waiting' && (
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xl shrink-0">
                      {res.position}
                    </div>
                  )}
                  <div className="w-10 h-14 bg-secondary rounded shrink-0 overflow-hidden">
                    {res.book?.imageUrl && <img src={res.book.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground line-clamp-1">{res.book?.title}</h4>
                    <p className="text-sm text-muted-foreground">{STRINGS.reservationsAdmin.readerLabel} <span className="font-medium text-foreground">{res.user?.name}</span> {res.user?.block ? `(${res.user.block}-${res.user.house})` : ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor('reservation', res.status)} text-[10px] px-2 py-0 h-5`}>{res.status}</Badge>
                      {res.expiresAt && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Expires: {formatDate(res.expiresAt)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  {res.status === 'waiting' && res.position === 1 && (
                    <Button
                      variant="primary"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction(res.id, 'notify', { phone: res.user?.phone, name: res.user?.name, bookTitle: res.book?.title })}
                      isLoading={actionMutation.isPending && actionMutation.variables?.id === res.id}
                    >
                      <MessageCircle size={16} /> {STRINGS.reservationsAdmin.notifyWhatsApp}
                    </Button>
                  )}
                  {res.status === 'waiting' && res.position > 1 && (
                    <Button variant="outline" size="sm" onClick={() => handleAction(res.id, 'advance')}>
                      <ArrowUp size={16} className="mr-1" /> {STRINGS.reservationsAdmin.advance}
                    </Button>
                  )}
                  {res.status === 'notified' && (
                    <>
                      <Button variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleAction(res.id, 'fulfill')}>
                        <Check size={16} className="mr-1" /> {STRINGS.reservationsAdmin.markPickedUp}
                      </Button>
                      <Button variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => handleAction(res.id, 'cancel')}>
                        <X size={16} className="mr-1" /> {STRINGS.reservationsAdmin.cancel}
                      </Button>
                    </>
                  )}
                  {res.status === 'waiting' && (
                    <Button variant="ghost" className="text-red-600" onClick={() => handleAction(res.id, 'cancel')}>
                      {STRINGS.reservationsAdmin.cancel}
                    </Button>
                  )}
                </div>

              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
