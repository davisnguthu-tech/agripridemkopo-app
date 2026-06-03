import { useParams, Link } from "wouter";
import {
  useGetFarmer,
  getGetFarmerQueryKey,
  useListLoanApplications,
  useListLoans,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Phone, Crop, Ruler, Calendar, FileText, Banknote } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved" || status === "disbursed" || status === "repaid") return "default";
  if (status === "pending") return "secondary";
  if (status === "rejected" || status === "defaulted") return "destructive";
  return "outline";
}

const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

export function FarmerDetail() {
  const { id } = useParams<{ id: string }>();
  const farmerId = parseInt(id, 10);

  const { data: farmer, isLoading } = useGetFarmer(farmerId, {
    query: { enabled: !!farmerId, queryKey: getGetFarmerQueryKey(farmerId) },
  });
  const { data: applications } = useListLoanApplications({ farmerId });
  const { data: loans } = useListLoans({ farmerId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">Farmer not found.</p>
        <Link href="/farmers">
          <Button variant="outline" className="mt-4">Back to Farmers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/farmers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Farmers
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{farmer.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{farmer.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{farmer.county}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span>{farmer.farmSizeAcres} acres</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Crop className="h-4 w-4 text-muted-foreground" />
            <span>{farmer.cropType}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {new Date(farmer.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm col-span-2">
            <span className="text-muted-foreground text-xs font-mono">ID: {farmer.nationalId}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Loan Applications
          </CardTitle>
          <Link href={`/loan-applications?farmerId=${farmer.id}`}>
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>AI Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!applications || applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground text-sm">
                    No applications yet
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/loan-applications/${app.id}`}>
                    <TableCell className="font-mono text-xs">APP-{app.id}</TableCell>
                    <TableCell className="font-semibold">{formatKes(app.amountRequested)}</TableCell>
                    <TableCell>{app.purpose}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {app.aiScore != null ? (
                        <span className={`font-mono font-bold text-sm ${app.aiScore >= 70 ? "text-green-600" : app.aiScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {app.aiScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-4 w-4" /> Loans
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loans || loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground text-sm">
                    No loans yet
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/loans/${loan.id}`}>
                    <TableCell className="font-mono text-xs">LN-{loan.id}</TableCell>
                    <TableCell className="font-semibold">{formatKes(loan.amount)}</TableCell>
                    <TableCell><Badge variant={statusVariant(loan.status)}>{loan.status}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">
                      {loan.amountPaid != null ? formatKes(loan.amountPaid) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
