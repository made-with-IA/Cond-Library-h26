import React from "react";
import { useGetLibraryDashboard } from "@workspace/api-client-react";
import { BookOpen, Users, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

export default function AdminDashboard() {
  const { data, isLoading } = useGetLibraryDashboard();

  if (isLoading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-muted rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-foreground">Library Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Books" 
          value={data?.totalBooks || 0} 
          subtitle={`${data?.availableBooks || 0} currently available`}
          icon={<BookOpen size={24} />} 
          color="bg-blue-100 text-blue-700" 
        />
        <StatCard 
          title="Active Readers" 
          value={data?.activeReaders || 0} 
          subtitle="Registered residents"
          icon={<Users size={24} />} 
          color="bg-indigo-100 text-indigo-700" 
        />
        <StatCard 
          title="Borrowed Books" 
          value={data?.borrowedBooks || 0} 
          subtitle="Out with readers"
          icon={<Clock size={24} />} 
          color="bg-orange-100 text-orange-700" 
        />
        <StatCard 
          title="Overdue Loans" 
          value={data?.overdueLoans || 0} 
          subtitle="Require attention"
          icon={<AlertTriangle size={24} />} 
          color="bg-red-100 text-red-700 border-red-200" 
          highlight
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-12">
        <Card>
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
             <TrendingUp className="text-primary" size={20}/>
             <h3 className="font-display font-bold text-lg text-primary">Popular Titles</h3>
          </div>
          <div className="divide-y divide-border/50">
            {data?.popularBooks.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">No data available.</p>
            ) : (
              data?.popularBooks.slice(0, 5).map(book => (
                <div key={book.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50">
                  <div className="w-10 h-14 bg-secondary rounded overflow-hidden">
                    {book.imageUrl && <img src={book.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">{book.title}</h4>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, icon, color, highlight }: StatCardProps) {
  return (
    <Card className={`overflow-hidden ${highlight ? 'border-red-200 shadow-md shadow-red-100' : 'border-border/50 shadow-sm'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={`text-4xl font-bold ${highlight ? 'text-red-700' : 'text-foreground'}`}>{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 font-medium">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
