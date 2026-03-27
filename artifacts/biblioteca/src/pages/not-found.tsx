import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground mb-6 shadow-sm border border-border">
        <BookOpen size={40} />
      </div>
      <h1 className="text-4xl font-display font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">We couldn't find the page you're looking for. It might have been moved or doesn't exist.</p>
      
      <Link href="/">
        <Button size="lg" className="px-8">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
