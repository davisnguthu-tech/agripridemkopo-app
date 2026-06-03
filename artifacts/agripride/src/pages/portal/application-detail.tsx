import { useParams, Link } from "wouter";
import { useApplicantApplication } from "@/hooks/use-applicant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Brain, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "approved") return "default";
  if (s === "rejected") return "destructive";
  return "secondary";
}

const formatKes = (v: number | string) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(v));

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  return <span className={`font-mono font-bold text-2xl ${color}`}>{score}/100</span>;
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: app, isLoading, refetch } = useApplicantApplication(parseInt(id, 10));

  const isReviewing = app?.status === "reviewing" || app?.status === "pending";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Application not found.</p>
        <Link href="/portal"><Button variant="outline" className="mt-4">Go to dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application #{app.id}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Submitted {new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusVariant(app.status)} className="text-sm px-3 py-1">
          {app.status === "reviewing" ? "Under Review" : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </Badge>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Amount</span><p className="font-bold text-lg">{formatKes(app.amountRequested)}</p></div>
            <div><span className="text-muted-foreground">Purpose</span><p className="font-medium">{app.purpose}</p></div>
            <div><span className="text-muted-foreground">County</span><p className="font-medium">{app.county}</p></div>
            <div><span className="text-muted-foreground">Crop</span><p className="font-medium">{app.cropType}</p></div>
            <div><span className="text-muted-foreground">Farm Size</span><p className="font-medium">{app.farmSizeAcres} acres</p></div>
          </div>
        </CardContent>
      </Card>

      {/* AI Review Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI Agent Review
          </h2>
          {isReviewing && (
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking...
            </Button>
          )}
        </div>

        {isReviewing ? (
          <Card>
            <CardContent className="py-8 text-center space-y-3">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
              </div>
              <p className="text-sm font-medium">3 AI agents are reviewing your application</p>
              <p className="text-xs text-muted-foreground">This usually takes less than 2 minutes. Refresh to check.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
                Refresh status
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Agent 1 */}
            <Card className="border-l-4 border-l-blue-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">Agent 1</span>
                  Credit Risk Assessor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.agent1Score != null ? (
                  <>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={app.agent1Score} />
                      <div className="flex-1">
                        <Progress value={app.agent1Score} className="h-2" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{app.agent1Review}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Review pending...</p>
                )}
              </CardContent>
            </Card>

            {/* Agent 2 */}
            <Card className="border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Agent 2</span>
                  Agricultural Context Analyst
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.agent2Score != null ? (
                  <>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={app.agent2Score} />
                      <div className="flex-1">
                        <Progress value={app.agent2Score} className="h-2" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{app.agent2Review}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Review pending...</p>
                )}
              </CardContent>
            </Card>

            {/* Agent 3 Final */}
            <Card className={`border-2 ${app.finalDecision === "approved" ? "border-green-500" : app.finalDecision === "rejected" ? "border-destructive" : "border-border"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Agent 3</span>
                  Final Decision Authority
                  {app.finalDecision === "approved" && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                  {app.finalDecision === "rejected" && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
                  {!app.finalDecision && <Clock className="h-4 w-4 text-muted-foreground ml-auto" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.finalScore != null ? (
                  <>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={app.finalScore} />
                      <div className="flex-1">
                        <Progress value={app.finalScore} className="h-2" />
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg text-sm ${app.finalDecision === "approved" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                      {app.finalReason}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Awaiting final review...</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
