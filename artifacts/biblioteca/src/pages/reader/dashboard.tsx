import React from "react";
import { useLocation } from "wouter";
import { useReaderDashboard } from "@workspace/api-client-react";
import { BookOpen, AlertCircle, BellRing, History, Library } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { STRINGS } from "@/lib/constants";

export default function ReaderDashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useReaderDashboard();

  if (isLoading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-muted rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-muted rounded"></div><div className="h-4 bg-muted rounded w-5/6"></div></div></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">{STRINGS.readerDashboard.activeLoans}</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.activeLoans || 0}</h3>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <BookOpen size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">{STRINGS.readerDashboard.overdue}</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.overdueLoans || 0}</h3>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <AlertCircle size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">{STRINGS.readerDashboard.reservations}</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.pendingReservations || 0}</h3>
              </div>
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                <BellRing size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{STRINGS.readerDashboard.totalHistory}</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.totalLoans || 0}</h3>
              </div>
              <div className="p-3 bg-gray-200 text-gray-600 rounded-xl">
                <History size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="bg-white rounded-2xl border border-border/50 p-8 text-center max-w-2xl mx-auto shadow-sm mt-12">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Library size={32} />
        </div>
        <h2 className="text-2xl font-display font-semibold mb-2">{STRINGS.readerDashboard.ctaTitle}</h2>
        <p className="text-muted-foreground mb-6">{STRINGS.readerDashboard.ctaSubtitle}</p>
        <Button onClick={() => setLocation('/reader/catalog')} size="lg">{STRINGS.readerDashboard.ctaButton}</Button>
      </div>
    </div>
  );
}
