import { useState } from "react";
import { Link } from "wouter";
import { useListLoans, useDisburseLoan, getListLoansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Send, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "disbursed") return "default";
  if (status === "approved") return "secondary";
  if (status === "repaid") return "outline";
  if (status === "defaulted") return "destructive";
  return "outline";
}

const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

export function Loans() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const disburseMutation = useDisburseLoan();

  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: loans, isLoading } = useListLoans(params);

  const handleDisburse = (id: number) => {
    disburseMutation.mutate({ id }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
        toast({ title: "Disbursement initiated", description: result.message });
      },
      onError: () => toast({ title: "Disbursement failed", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Portfolio</h1>
          <p className="text-muted-foreground mt-1">Manage active and historical loans.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
            <SelectItem value="repaid">Repaid</SelectItem>
            <SelectItem value="defaulted">Defaulted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Repaid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
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
              ) : !loans || loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No loans found
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => {
                  const paidPct = loan.amountPaid != null ? Math.min((loan.amountPaid / loan.amount) * 100, 100) : 0;
                  const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === "disbursed";

                  return (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">LN-{loan.id}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{loan.farmerName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{loan.farmerPhone}</div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatKes(loan.amount)}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{loan.interestRate}%</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="space-y-1">
                          <Progress value={paidPct} className="h-1.5" />
                          <span className="text-xs text-muted-foreground font-mono">
                            {loan.amountPaid != null ? formatKes(loan.amountPaid) : "0"} / {formatKes(loan.amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(loan.status)}>{loan.status}</Badge>
                      </TableCell>
                      <TableCell className={`text-xs ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {new Date(loan.dueDate).toLocaleDateString()}
                        {isOverdue && " (Overdue)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {loan.status === "approved" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs gap-1 text-primary"
                              onClick={() => handleDisburse(loan.id)}
                              disabled={disburseMutation.isPending}
                              data-testid={`btn-disburse-${loan.id}`}
                            >
                              {disburseMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              Disburse
                            </Button>
                          )}
                          <Link href={`/loans/${loan.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2" data-testid={`btn-view-loan-${loan.id}`}>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
