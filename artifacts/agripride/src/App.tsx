import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import { Landing } from "@/pages/landing";
import { Layout } from "@/components/layout";
import { PortalLayout } from "@/components/portal-layout";
import { Dashboard } from "@/pages/dashboard";
import { Farmers } from "@/pages/farmers";
import { FarmerDetail } from "@/pages/farmer-detail";
import { LoanApplications } from "@/pages/loan-applications";
import { LoanApplicationDetail } from "@/pages/loan-application-detail";
import { Loans } from "@/pages/loans";
import { LoanDetail } from "@/pages/loan-detail";
import { Login } from "@/pages/login";
import { PortalHome } from "@/pages/portal/index";
import { Apply } from "@/pages/portal/apply";
import { ApplicationDetail } from "@/pages/portal/application-detail";
import { PortalProfile } from "@/pages/portal/profile";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#2D5A1B",
    colorForeground: "#1a1a14",
    colorMutedForeground: "#6b7059",
    colorDanger: "#dc2626",
    colorBackground: "#f9f7f3",
    colorInput: "#ffffff",
    colorInputForeground: "#1a1a14",
    colorNeutral: "#d4cfbf",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-sm border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground text-sm font-medium",
    footerActionLink: "text-primary font-semibold hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-foreground",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-border bg-card hover:bg-muted text-foreground rounded-md",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold",
    formFieldInput: "border-border bg-input text-foreground rounded-md",
    footerAction: "border-t border-border",
    dividerLine: "bg-border",
    alert: "border border-border bg-card rounded-md",
    otpCodeFieldInput: "border-border",
    formFieldRow: "gap-3",
    main: "gap-4",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function OfficerSection() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/officer" component={Dashboard} />
        <Route path="/officer/farmers" component={Farmers} />
        <Route path="/officer/farmers/:id" component={FarmerDetail} />
        <Route path="/officer/loan-applications" component={LoanApplications} />
        <Route path="/officer/loan-applications/:id" component={LoanApplicationDetail} />
        <Route path="/officer/loans" component={Loans} />
        <Route path="/officer/loans/:id" component={LoanDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ApplicantPortal() {
  return (
    <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
      <PortalLayout>
        <Switch>
          <Route path="/portal" component={PortalHome} />
          <Route path="/portal/apply" component={Apply} />
          <Route path="/portal/applications/:id" component={ApplicationDetail} />
          <Route path="/portal/profile" component={PortalProfile} />
          <Route component={NotFound} />
        </Switch>
      </PortalLayout>
    </Show>
  );
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your AgriPride account" } },
        signUp: { start: { title: "Apply for a loan", subtitle: "Create your AgriPride account to get started" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AuthProvider>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/portal" component={ApplicantPortal} />
              <Route path="/portal/:rest*" component={ApplicantPortal} />
              <Route path="/officer" component={OfficerSection} />
              <Route path="/officer/:rest*" component={OfficerSection} />
              <Route component={NotFound} />
            </Switch>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
