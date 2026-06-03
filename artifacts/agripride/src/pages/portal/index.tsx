import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, FileText, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { useApplicantApplications, useApplicantProfile } from "@/hooks/use-applicant";

function statusIcon(status: string) {
  if (status === "approved") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

const formatKes = (v: number | string) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(v));

export function PortalHome() {
  const { user } = useUser();
  const { data: profile, isLoading: profileLoading } = useApplicantProfile();
  const { data: applications, isLoading: appsLoading } = useApplicantApplications();

  const profileComplete = profile && profile.name && profile.county && profile.cropType;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your loan applications from here.</p>
        </div>
        <Link href="/portal/apply">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Apply for a Loan
          </Button>
        </Link>
      </div>

      {!profileLoading && !profileComplete && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-sm">Complete your profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add your farm details to speed up loan reviews.
              </p>
            </div>
            <Link href="/portal/profile">
              <Button size="sm" variant="outline" className="gap-1">
                Set up profile <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" /> My Applications
          </CardTitle>
          {applications && applications.length > 0 && (
            <Link href="/portal/applications">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {appsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No applications yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apply for your first agricultural loan to get started.
                </p>
              </div>
              <Link href="/portal/apply">
                <Button size="sm" className="gap-2 mt-1">
                  <Plus className="h-3 w-3" /> Apply now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <Link key={app.id} href={`/portal/applications/${app.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    {statusIcon(app.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{app.purpose}</span>
                        <Badge variant={statusVariant(app.status)} className="text-xs shrink-0">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatKes(app.amountRequested)} &bull; {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {applications && applications.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Applications", value: applications.length },
            { label: "Approved", value: applications.filter((a) => a.status === "approved").length },
            { label: "Pending Review", value: applications.filter((a) => a.status === "reviewing" || a.status === "pending").length },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
