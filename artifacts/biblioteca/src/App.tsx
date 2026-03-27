import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AdminAuthProvider, ReaderAuthProvider } from "@/contexts/AuthContext";
import { PublicLayout, ReaderLayout, AdminLayout } from "@/components/layouts";

// Pages
import Home from "@/pages/public/home";
import Lookup from "@/pages/public/lookup";

import ReaderLogin from "@/pages/reader/login";
import ReaderDashboard from "@/pages/reader/dashboard";
import ReaderCatalog from "@/pages/reader/catalog";
import ReaderLoans from "@/pages/reader/loans";
import ReaderReservations from "@/pages/reader/reservations";
import ReaderProfile from "@/pages/reader/profile";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminBooks from "@/pages/admin/books";
import AdminBookForm from "@/pages/admin/book-form";
import AdminBookDetail from "@/pages/admin/book-detail";
import AdminReaders from "@/pages/admin/readers";
import AdminReaderDetail from "@/pages/admin/reader-detail";
import AdminLoans from "@/pages/admin/loans";
import AdminLoanDetail from "@/pages/admin/loan-detail";
import AdminNewLoan from "@/pages/admin/new-loan";
import AdminReservations from "@/pages/admin/reservations";
import AdminReports from "@/pages/admin/reports";
import AdminNotes from "@/pages/admin/notes";
import AdminUsers from "@/pages/admin/admins";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/reader">
        <PublicLayout><Lookup /></PublicLayout>
      </Route>
      
      {/* Reader Auth */}
      <Route path="/reader/login">
        <ReaderLogin />
      </Route>

      {/* Reader Portal */}
      <Route path="/reader/*">
        <ReaderLayout>
          <Switch>
            <Route path="/reader/dashboard"><ReaderDashboard /></Route>
            <Route path="/reader/catalog"><ReaderCatalog /></Route>
            <Route path="/reader/loans"><ReaderLoans /></Route>
            <Route path="/reader/reservations"><ReaderReservations /></Route>
            <Route path="/reader/profile"><ReaderProfile /></Route>
            <Route component={NotFound} />
          </Switch>
        </ReaderLayout>
      </Route>

      {/* Admin Auth */}
      <Route path="/admin">
        <AdminLogin />
      </Route>
      <Route path="/admin/login">
        <AdminLogin />
      </Route>

      {/* Admin Portal */}
      <Route path="/admin/*">
        <AdminLayout>
          <Switch>
            <Route path="/admin/dashboard"><AdminDashboard /></Route>
            <Route path="/admin/books"><AdminBooks /></Route>
            <Route path="/admin/books/new"><AdminBookForm /></Route>
            <Route path="/admin/books/:id"><AdminBookDetail /></Route>
            <Route path="/admin/books/:id/edit"><AdminBookForm /></Route>
            <Route path="/admin/readers"><AdminReaders /></Route>
            <Route path="/admin/readers/:id"><AdminReaderDetail /></Route>
            <Route path="/admin/loans"><AdminLoans /></Route>
            <Route path="/admin/loans/new"><AdminNewLoan /></Route>
            <Route path="/admin/loans/:id"><AdminLoanDetail /></Route>
            <Route path="/admin/reservations"><AdminReservations /></Route>
            <Route path="/admin/reports"><AdminReports /></Route>
            <Route path="/admin/notes"><AdminNotes /></Route>
            <Route path="/admin/admins"><AdminUsers /></Route>
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminAuthProvider>
          <ReaderAuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRouter />
            </WouterRouter>
            <Toaster />
          </ReaderAuthProvider>
        </AdminAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
