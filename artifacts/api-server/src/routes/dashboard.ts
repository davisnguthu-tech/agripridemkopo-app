import { Router, type IRouter } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, farmersTable, loanApplicationsTable, loansTable, repaymentsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentActivityResponse,
  GetLoanPortfolioResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [farmerCount] = await db.select({ count: sql<number>`count(*)::int` }).from(farmersTable);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(loanApplicationsTable).where(eq(loanApplicationsTable.status, "pending"));

  const activeLoans = await db.select().from(loansTable).where(eq(loansTable.status, "disbursed"));
  const defaultedLoans = await db.select().from(loansTable).where(eq(loansTable.status, "defaulted"));
  const allDisbursed = await db.select().from(loansTable)
    .where(sql`status != 'approved'`);

  const totalLoansKes = allDisbursed.reduce((sum, l) => sum + Number(l.amount), 0);
  const defaultRate = allDisbursed.length > 0 ? (defaultedLoans.length / allDisbursed.length) * 100 : 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const disbursedThisMonth = await db.select().from(loansTable)
    .where(and(eq(loansTable.status, "disbursed"), gte(loansTable.disbursedAt, startOfMonth)));

  const repaymentsThisMonth = await db.select().from(repaymentsTable)
    .where(gte(repaymentsTable.paidAt, startOfMonth));

  // Portfolio at risk: active loans past due date
  const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < now);
  const portfolioAtRisk = activeLoans.length > 0
    ? (overdueLoans.reduce((s, l) => s + Number(l.amount), 0) / activeLoans.reduce((s, l) => s + Number(l.amount), 1)) * 100
    : 0;

  res.json(GetDashboardStatsResponse.parse({
    totalFarmers: farmerCount.count,
    totalLoansKes,
    activeLoanCount: activeLoans.length,
    defaultRate: Math.round(defaultRate * 10) / 10,
    pendingApplications: pendingCount.count,
    disbursedThisMonth: disbursedThisMonth.reduce((s, l) => s + Number(l.amount), 0),
    repaidThisMonth: repaymentsThisMonth.reduce((s, r) => s + Number(r.amount), 0),
    portfolioAtRisk: Math.round(portfolioAtRisk * 10) / 10,
  }));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const [recentApps, recentLoans, recentRepayments] = await Promise.all([
    db.select({ app: loanApplicationsTable, farmerName: farmersTable.name })
      .from(loanApplicationsTable)
      .leftJoin(farmersTable, eq(loanApplicationsTable.farmerId, farmersTable.id))
      .orderBy(loanApplicationsTable.createdAt)
      .limit(5),
    db.select({ loan: loansTable, farmerName: farmersTable.name })
      .from(loansTable)
      .leftJoin(farmersTable, eq(loansTable.farmerId, farmersTable.id))
      .where(eq(loansTable.status, "disbursed"))
      .orderBy(loansTable.disbursedAt)
      .limit(5),
    db.select({ repayment: repaymentsTable })
      .from(repaymentsTable)
      .orderBy(repaymentsTable.paidAt)
      .limit(5),
  ]);

  const activities = [
    ...recentApps.map(r => ({
      id: `app-${r.app.id}`,
      type: "application",
      description: `New loan application from ${r.farmerName ?? "farmer"}`,
      timestamp: r.app.createdAt.toISOString(),
      amount: Number(r.app.amountRequested),
      farmerName: r.farmerName ?? null,
    })),
    ...recentLoans.map(r => ({
      id: `loan-${r.loan.id}`,
      type: "disbursement",
      description: `Loan disbursed to ${r.farmerName ?? "farmer"} via M-Pesa`,
      timestamp: (r.loan.disbursedAt ?? r.loan.createdAt).toISOString(),
      amount: Number(r.loan.amount),
      farmerName: r.farmerName ?? null,
    })),
    ...recentRepayments.map(r => ({
      id: `rep-${r.repayment.id}`,
      type: "repayment",
      description: `Repayment received for loan #${r.repayment.loanId}`,
      timestamp: r.repayment.paidAt.toISOString(),
      amount: Number(r.repayment.amount),
      farmerName: null,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  res.json(GetRecentActivityResponse.parse(activities));
});

router.get("/dashboard/portfolio", async (_req, res): Promise<void> => {
  const loans = await db
    .select({ loan: loansTable, cropType: farmersTable.cropType, county: farmersTable.county })
    .from(loansTable)
    .leftJoin(farmersTable, eq(loansTable.farmerId, farmersTable.id))
    .where(sql`${loansTable.status} != 'approved'`);

  const byStatus = ["disbursed", "repaid", "defaulted"].map(status => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count: loans.filter(l => l.loan.status === status).length,
    amountKes: loans.filter(l => l.loan.status === status).reduce((s, l) => s + Number(l.loan.amount), 0),
  }));

  const cropMap = new Map<string, { count: number; amount: number }>();
  const countyMap = new Map<string, { count: number; amount: number }>();

  for (const l of loans) {
    const crop = l.cropType ?? "Other";
    const county = l.county ?? "Other";
    const amt = Number(l.loan.amount);

    const c = cropMap.get(crop) ?? { count: 0, amount: 0 };
    cropMap.set(crop, { count: c.count + 1, amount: c.amount + amt });

    const co = countyMap.get(county) ?? { count: 0, amount: 0 };
    countyMap.set(county, { count: co.count + 1, amount: co.amount + amt });
  }

  res.json(GetLoanPortfolioResponse.parse({
    byStatus,
    byCrop: Array.from(cropMap.entries()).map(([label, v]) => ({ label, count: v.count, amountKes: v.amount })),
    byCounty: Array.from(countyMap.entries()).map(([label, v]) => ({ label, count: v.count, amountKes: v.amount })),
  }));
});

export default router;
