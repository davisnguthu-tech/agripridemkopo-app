import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { Dashboard } from "@/pages/dashboard";
import { Farmers } from "@/pages/farmers";
import { FarmerDetail } from "@/pages/farmer-detail";
import { LoanApplications } from "@/pages/loan-applications";
import { LoanApplicationDetail } from "@/pages/loan-application-detail";
import { Loans } from "@/pages/loans";
import { LoanDetail } from "@/pages/loan-detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/farmers" component={Farmers} />
        <Route path="/farmers/:id" component={FarmerDetail} />
        <Route path="/loan-applications" component={LoanApplications} />
        <Route path="/loan-applications/:id" component={LoanApplicationDetail} />
        <Route path="/loans" component={Loans} />
        <Route path="/loans/:id" component={LoanDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;