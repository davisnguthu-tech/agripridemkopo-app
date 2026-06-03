import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, farmersTable, loanApplicationsTable, loansTable } from "@workspace/db";
import {
  ListLoanApplicationsQueryParams,
  ListLoanApplicationsResponse,
  CreateLoanApplicationBody,
  GetLoanApplicationParams,
  GetLoanApplicationResponse,
  ScoreLoanApplicationParams,
  ScoreLoanApplicationResponse,
  ApproveLoanApplicationParams,
  ApproveLoanApplicationBody,
  ApproveLoanApplicationResponse,
  RejectLoanApplicationParams,
  RejectLoanApplicationBody,
  RejectLoanApplicationResponse,
} from "@workspace/api-zod";
import { runCreditScore } from "../lib/openaiClient";
import { sendSms } from "../lib/africastalking";

const router: IRouter = Router();

function serializeApp(app: Record<string, unknown>, farmerName?: string | null, farmerPhone?: string | null) {
  return {
    ...app,
    farmerName: farmerName ?? null,
    farmerPhone: farmerPhone ?? null,
    amountRequested: Number(app.amountRequested),
    aiScore: app.aiScore != null ? Number(app.aiScore) : null,
    createdAt: (app.createdAt as Date).toISOString(),
    updatedAt: (app.updatedAt as Date).toISOString(),
  };
}

router.get("/loan-applications", async (req, res): Promise<void> => {
  const query = ListLoanApplicationsQueryParams.safeParse(req.query);
  const status = query.success ? query.data.status : undefined;
  const farmerId = query.success ? query.data.farmerId : undefined;

  const rows = await db
    .select({
      app: loanApplicationsTable,
      farmerName: farmersTable.name,
      farmerPhone: farmersTable.phone,
    })
    .from(loanApplicationsTable)
    .leftJoin(farmersTable, eq(loanApplicationsTable.farmerId, farmersTable.id))
    .where(
      and(
        status ? eq(loanApplicationsTable.status, status) : undefined,
        farmerId ? eq(loanApplicationsTable.farmerId, farmerId) : undefined,
      ),
    )
    .orderBy(loanApplicationsTable.createdAt);

  res.json(ListLoanApplicationsResponse.parse(
    rows.map(r => serializeApp(r.app as unknown as Record<string, unknown>, r.farmerName, r.farmerPhone)),
  ));
});

router.post("/loan-applications", async (req, res): Promise<void> => {
  const parsed = CreateLoanApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, parsed.data.farmerId));
  if (!farmer) {
    res.status(400).json({ error: "Farmer not found" });
    return;
  }

  const [app] = await db.insert(loanApplicationsTable).values({
    farmerId: parsed.data.farmerId,
    amountRequested: String(parsed.data.amountRequested),
    purpose: parsed.data.purpose,
    status: "pending",
  }).returning();

  res.status(201).json(GetLoanApplicationResponse.parse(
    serializeApp(app as unknown as Record<string, unknown>, farmer.name, farmer.phone),
  ));
});

router.get("/loan-applications/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetLoanApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ app: loanApplicationsTable, farmerName: farmersTable.name, farmerPhone: farmersTable.phone })
    .from(loanApplicationsTable)
    .leftJoin(farmersTable, eq(loanApplicationsTable.farmerId, farmersTable.id))
    .where(eq(loanApplicationsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Loan application not found" });
    return;
  }

  res.json(GetLoanApplicationResponse.parse(
    serializeApp(row.app as unknown as Record<string, unknown>, row.farmerName, row.farmerPhone),
  ));
});

router.post("/loan-applications/:id/score", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ScoreLoanApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ app: loanApplicationsTable, farmer: farmersTable })
    .from(loanApplicationsTable)
    .leftJoin(farmersTable, eq(loanApplicationsTable.farmerId, farmersTable.id))
    .where(eq(loanApplicationsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Loan application not found" });
    return;
  }

  // Count active loans
  const activeLoans = await db.select().from(loansTable)
    .where(and(eq(loansTable.farmerId, row.app.farmerId), eq(loansTable.status, "disbursed")));

  const result = await runCreditScore({
    farmerName: row.farmer?.name ?? "Unknown",
    county: row.farmer?.county ?? "Unknown",
    farmSizeAcres: Number(row.farmer?.farmSizeAcres ?? 0),
    cropType: row.farmer?.cropType ?? "Unknown",
    amountRequested: Number(row.app.amountRequested),
    purpose: row.app.purpose,
    existingLoans: activeLoans.length,
  });

  // Save score to application
  await db.update(loanApplicationsTable)
    .set({ aiScore: String(result.score), aiRecommendation: result.recommendation })
    .where(eq(loanApplicationsTable.id, params.data.id));

  res.json(ScoreLoanApplicationResponse.parse(result));
});

router.patch("/loan-applications/:id/approve", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveLoanApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ApproveLoanApplicationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [row] = await db
    .select({ app: loanApplicationsTable, farmer: farmersTable })
    .from(loanApplicationsTable)
    .leftJoin(farmersTable, eq(loanApplicationsTable.farmerId, farmersTable.id))
    .where(eq(loanApplicationsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db.update(loanApplicationsTable)
    .set({ status: "approved", reviewNote: body.data.reviewNote ?? null })
    .where(eq(loanApplicationsTable.id, params.data.id))
    .returning();

  // Create the loan record
  const approvedAmount = body.data.approvedAmount ?? Number(row.app.amountRequested);
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + 6);

  await db.insert(loansTable).values({
    applicationId: params.data.id,
    farmerId: row.app.farmerId,
    amount: String(approvedAmount),
    interestRate: "12.00",
    status: "approved",
    dueDate,
  });

  // SMS notification
  if (row.farmer?.phone) {
    await sendSms(
      row.farmer.phone,
      `Hongera ${row.farmer.name}! Your AgriPride loan of KES ${approvedAmount.toLocaleString()} has been approved. We will disburse it to your M-Pesa shortly.`,
    );
  }

  res.json(ApproveLoanApplicationResponse.parse(
    serializeApp(updated as unknown as Record<string, unknown>, row.farmer?.name, row.farmer?.phone),
  ));
});

router.patch("/loan-applications/:id/reject", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RejectLoanApplicationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = RejectLoanApplicationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [row] = await db
    .select({ app: loanApplicationsTable, farmer: farmersTable })
    .from(loanApplicationsTable)
    .leftJoin(farmersTable, eq(loanApplicationsTable.farmerId, farmersTable.id))
    .where(eq(loanApplicationsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db.update(loanApplicationsTable)
    .set({ status: "rejected", reviewNote: body.data.reviewNote ?? null })
    .where(eq(loanApplicationsTable.id, params.data.id))
    .returning();

  if (row.farmer?.phone) {
    await sendSms(
      row.farmer.phone,
      `Dear ${row.farmer.name}, your AgriPride loan application was not successful at this time. ${body.data.reviewNote ?? "Please contact us for more information."}`,
    );
  }

  res.json(RejectLoanApplicationResponse.parse(
    serializeApp(updated as unknown as Record<string, unknown>, row.farmer?.name, row.farmer?.phone),
  ));
});

export default router;
