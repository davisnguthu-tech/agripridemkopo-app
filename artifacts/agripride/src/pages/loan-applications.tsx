import { useState } from "react";
import { Link } from "wouter";
import {
  useListLoanApplications,
  useScoreLoanApplication,
  useApproveLoanApplication,
  useRejectLoanApplication,
  getListLoanApplicationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronRight, Loader2, Brain, CheckCircle, XCircle } from "lucide-react";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "pending") return "secondary";
  if (status === "rejected") return "destructive";
  return "outline";
}

const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

export function LoanApplications() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [decisionApp, setDecisionApp] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: applications, isLoading } = useListLoanApplications(params);

  const scoreMutation = useScoreLoanApplication();
  const approveMutation = useApproveLoanApplication();
  const rejectMutation = useRejectLoanApplication();

  const handleScore = (id: number) => {
    scoreMutation.mutate({ id }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListLoanApplicationsQueryKey() });
        toast({
          title: `AI Score: ${result.score}/100`,
          description: result.recommendation,
        });
      },
      onError: () => toast({ title: "Scoring failed", variant: "destructive" }),
    });
  };

  const handleDecision = () => {
    if (!decisionApp) return;
    const mutation = decisionApp.action === "approve" ? approveMutation : rejectMutation;
    mutation.mutate({ id: decisionApp.id, data: { reviewNote } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLoanApplicationsQueryKey() });
        setDecisionApp(null);
        setReviewNote("");
        toast({ title: `Application ${decisionApp.action === "approve" ? "approved" : "rejected"}` });
      },
      onError: () => toast({ title: "Action failed", variant: "destructive" }),
    });
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground mt-1">Review and action incoming loan requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !applications || applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">APP-{app.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{app.farmerName ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{app.farmerPhone}</div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatKes(app.amountRequested)}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{app.purpose}</TableCell>
                    <TableCell>
                      {app.aiScore != null ? (
                        <span className={`font-mono font-bold text-sm ${app.aiScore >= 70 ? "text-green-600" : app.aiScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {app.aiScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {app.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleScore(app.id)}
                              disabled={scoreMutation.isPending}
                              data-testid={`btn-score-${app.id}`}
                            >
                              {scoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setDecisionApp({ id: app.id, action: "approve" })}
                              data-testid={`btn-approve-${app.id}`}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDecisionApp({ id: app.id, action: "reject" })}
                              data-testid={`btn-reject-${app.id}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Link href={`/loan-applications/${app.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2" data-testid={`btn-view-app-${app.id}`}>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!decisionApp} onOpenChange={() => { setDecisionApp(null); setReviewNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionApp?.action === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Review Note (optional)</Label>
            <Textarea
              placeholder="Add a note for the farmer..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              data-testid="textarea-review-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionApp(null)}>Cancel</Button>
            <Button
              onClick={handleDecision}
              disabled={isPending}
              variant={decisionApp?.action === "approve" ? "default" : "destructive"}
              data-testid="btn-confirm-decision"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decisionApp?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
