import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetLoan,
  getGetLoanQueryKey,
  useListRepayments,
  getListRepaymentsQueryKey,
  useDisburseLoan,
  useInitiateRepayment,
  getListLoansQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Send, Loader2, Smartphone, Banknote, User, Calendar } from "lucide-react";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "disbursed") return "default";
  if (status === "approved") return "secondary";
  if (status === "repaid") return "outline";
  if (status === "defaulted") return "destructive";
  return "outline";
}

const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const repaySchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
  amount: z.coerce.number().min(100, "Minimum KES 100"),
});

export function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const loanId = parseInt(id, 10);
  const [repayOpen, setRepayOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loan, isLoading } = useGetLoan(loanId, {
    query: { enabled: !!loanId, queryKey: getGetLoanQueryKey(loanId) },
  });
  const { data: repayments } = useListRepayments(loanId, {
    query: { enabled: !!loanId, queryKey: getListRepaymentsQueryKey(loanId) },
  });

  const disburseMutation = useDisburseLoan();
  const repayMutation = useInitiateRepayment();

  const form = useForm<z.infer<typeof repaySchema>>({
    resolver: zodResolver(repaySchema),
    defaultValues: { phone: loan?.farmerPhone ?? "", amount: 0 },
  });

  const handleDisburse = () => {
    disburseMutation.mutate({ id: loanId }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(loanId) });
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
        toast({ title: "Disbursement initiated", description: result.message });
      },
      onError: () => toast({ title: "Disbursement failed", variant: "destructive" }),
    });
  };

  const handleRepay = (values: z.infer<typeof repaySchema>) => {
    repayMutation.mutate({ id: loanId, data: values }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListRepaymentsQueryKey(loanId) });
        setRepayOpen(false);
        form.reset();
        toast({ title: "STK push sent", description: result.message });
      },
      onError: () => toast({ title: "Repayment initiation failed", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Loan not found.</p>
        <Link href="/loans">
          <Button variant="outline" className="mt-4">Back to Loans</Button>
        </Link>
      </div>
    );
  }

  const paidPct = loan.amountPaid != null ? Math.min((loan.amountPaid / loan.amount) * 100, 100) : 0;
  const outstanding = loan.amount - (loan.amountPaid ?? 0);
  const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === "disbursed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/loans">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Loans
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LN-{loan.id}</h1>
          <p className="text-muted-foreground mt-1">
            Application APP-{loan.applicationId}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Badge variant={statusVariant(loan.status)} className="text-sm px-3 py-1">
            {loan.status.toUpperCase()}
          </Badge>
          {loan.status === "approved" && (
            <Button onClick={handleDisburse} disabled={disburseMutation.isPending} className="gap-2" data-testid="btn-disburse">
              {disburseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Disburse via M-Pesa
            </Button>
          )}
          {loan.status === "disbursed" && (
            <Button onClick={() => setRepayOpen(true)} variant="outline" className="gap-2" data-testid="btn-initiate-repayment">
              <Smartphone className="h-4 w-4" />
              Collect Repayment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Farmer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Farmer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-semibold">{loan.farmerName ?? "—"}</div>
            <div className="font-mono text-sm text-muted-foreground">{loan.farmerPhone ?? "—"}</div>
            <Link href={`/farmers/${loan.farmerId}`} className="text-xs text-primary hover:underline">
              View farmer profile
            </Link>
          </CardContent>
        </Card>

        {/* Loan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" /> Loan Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Principal</span>
              <span className="font-bold">{formatKes(loan.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-mono">{loan.interestRate}% p.a.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Outstanding</span>
              <span className={`font-bold ${outstanding > 0 ? "text-destructive" : "text-green-600"}`}>
                {formatKes(outstanding)}
              </span>
            </div>
            <Progress value={paidPct} className="h-2 mt-2" />
            <div className="text-xs text-muted-foreground text-right">{paidPct.toFixed(0)}% repaid</div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4" /> Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(loan.createdAt).toLocaleDateString()}</span>
            </div>
            {loan.disbursedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disbursed</span>
                <span>{new Date(loan.disbursedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span className={isOverdue ? "text-destructive font-semibold" : ""}>
                {new Date(loan.dueDate).toLocaleDateString()}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
            {loan.mpesaReceipt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">M-Pesa Ref</span>
                <span className="font-mono text-xs">{loan.mpesaReceipt}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repayment History */}
      <Card>
        <CardHeader>
          <CardTitle>Repayment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>M-Pesa Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!repayments || repayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground text-sm">
                    No repayments recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                repayments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{new Date(r.paidAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">{formatKes(r.amount)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.mpesaReceipt ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Repayment Dialog */}
      <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Repayment via M-Pesa STK Push</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRepay)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farmer Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+254712345678" {...field} data-testid="input-repay-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} data-testid="input-repay-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Outstanding balance: <strong>{formatKes(outstanding)}</strong>
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRepayOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={repayMutation.isPending} data-testid="btn-send-stk">
                  {repayMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                  Send STK Push
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
