import { useParams, Link } from "wouter";
import {
  useGetLoanApplication,
  getGetLoanApplicationQueryKey,
  useScoreLoanApplication,
  useApproveLoanApplication,
  useRejectLoanApplication,
  getListLoanApplicationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Brain, CheckCircle, XCircle, Loader2, User, Banknote, Target, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "pending") return "secondary";
  if (status === "rejected") return "destructive";
  return "outline";
}

const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

export function LoanApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const appId = parseInt(id, 10);
  const [reviewNote, setReviewNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useGetLoanApplication(appId, {
    query: { enabled: !!appId, queryKey: getGetLoanApplicationQueryKey(appId) },
  });

  const scoreMutation = useScoreLoanApplication();
  const approveMutation = useApproveLoanApplication();
  const rejectMutation = useRejectLoanApplication();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetLoanApplicationQueryKey(appId) });
    queryClient.invalidateQueries({ queryKey: getListLoanApplicationsQueryKey() });
  };

  const handleScore = () => {
    scoreMutation.mutate({ id: appId }, {
      onSuccess: () => { invalidate(); toast({ title: "Credit score calculated" }); },
      onError: () => toast({ title: "Scoring failed", variant: "destructive" }),
    });
  };

  const handleApprove = () => {
    approveMutation.mutate({ id: appId, data: { reviewNote } }, {
      onSuccess: () => { invalidate(); toast({ title: "Application approved" }); },
      onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({ id: appId, data: { reviewNote } }, {
      onSuccess: () => { invalidate(); toast({ title: "Application rejected" }); },
      onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Application not found.</p>
        <Link href="/loan-applications">
          <Button variant="outline" className="mt-4">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  const scoreColor = app.aiScore != null
    ? app.aiScore >= 70 ? "text-green-600" : app.aiScore >= 50 ? "text-yellow-600" : "text-red-600"
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/loan-applications">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Applications
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">APP-{app.id}</h1>
          <p className="text-muted-foreground mt-1">{app.purpose}</p>
        </div>
        <Badge variant={statusVariant(app.status)} className="text-sm px-3 py-1 self-start sm:self-auto">
          {app.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farmer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Farmer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{app.farmerName ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono">{app.farmerPhone ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Farmer ID</span>
              <Link href={`/farmers/${app.farmerId}`} className="text-primary hover:underline font-mono text-xs">
                F-{app.farmerId}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" /> Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Requested</span>
              <span className="font-bold text-lg">{formatKes(app.amountRequested)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Purpose</span>
              <span className="font-medium">{app.purpose}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Applied</span>
              <span>{new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Credit Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" /> AI Credit Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {app.aiScore != null ? (
              <>
                <div className="flex items-end gap-3">
                  <span className={`text-5xl font-bold font-mono ${scoreColor}`}>{app.aiScore}</span>
                  <span className="text-muted-foreground text-sm mb-2">/100</span>
                </div>
                <Progress value={app.aiScore} className="h-2" />
                {app.aiRecommendation && (
                  <p className="text-sm text-muted-foreground italic">{app.aiRecommendation}</p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <Target className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No score yet</p>
                {app.status === "pending" && (
                  <Button
                    onClick={handleScore}
                    disabled={scoreMutation.isPending}
                    variant="outline"
                    size="sm"
                    data-testid="btn-run-score"
                  >
                    {scoreMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    Run Credit Score
                  </Button>
                )}
              </div>
            )}
            {app.aiScore != null && app.status === "pending" && (
              <Button onClick={handleScore} variant="ghost" size="sm" disabled={scoreMutation.isPending} className="w-full text-xs">
                {scoreMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Brain className="mr-2 h-3 w-3" />}
                Re-score
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Decision */}
        {app.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" /> Make Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Review Note</Label>
                <Textarea
                  placeholder="Add a review note for the farmer..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  data-testid="textarea-review-note"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 gap-2"
                  data-testid="btn-approve"
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approve
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  variant="destructive"
                  className="flex-1 gap-2"
                  data-testid="btn-reject"
                >
                  {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {app.reviewNote && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">{app.reviewNote}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
