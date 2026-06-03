import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, farmersTable, loansTable, repaymentsTable } from "@workspace/db";
import {
  ListLoansQueryParams,
  ListLoansResponse,
  GetLoanParams,
  GetLoanResponse,
  DisburseLoanParams,
  DisburseLoanResponse,
  ListRepaymentsParams,
  ListRepaymentsResponse,
  InitiateRepaymentParams,
  InitiateRepaymentBody,
  InitiateRepaymentResponse,
} from "@workspace/api-zod";
import { b2cDisbursement, stkPush } from "../lib/mpesa";

const router: IRouter = Router();

function serializeLoan(loan: Record<string, unknown>, farmerName?: string | null, farmerPhone?: string | null) {
  return {
    ...loan,
    farmerName: farmerName ?? null,
    farmerPhone: farmerPhone ?? null,
    amount: Number(loan.amount),
    interestRate: Number(loan.interestRate),
    amountPaid: loan.amountPaid != null ? Number(loan.amountPaid) : null,
    dueDate: (loan.dueDate as Date).toISOString(),
    disbursedAt: loan.disbursedAt ? (loan.disbursedAt as Date).toISOString() : null,
    createdAt: (loan.createdAt as Date).toISOString(),
  };
}

router.get("/loans", async (req, res): Promise<void> => {
  const query = ListLoansQueryParams.safeParse(req.query);
  const status = query.success ? query.data.status : undefined;
  const farmerId = query.success ? query.data.farmerId : undefined;

  const rows = await db
    .select({ loan: loansTable, farmerName: farmersTable.name, farmerPhone: farmersTable.phone })
    .from(loansTable)
    .leftJoin(farmersTable, eq(loansTable.farmerId, farmersTable.id))
    .where(
      and(
        status ? eq(loansTable.status, status) : undefined,
        farmerId ? eq(loansTable.farmerId, farmerId) : undefined,
      ),
    )
    .orderBy(loansTable.createdAt);

  res.json(ListLoansResponse.parse(
    rows.map(r => serializeLoan(r.loan as unknown as Record<string, unknown>, r.farmerName, r.farmerPhone)),
  ));
});

router.get("/loans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetLoanParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ loan: loansTable, farmerName: farmersTable.name, farmerPhone: farmersTable.phone })
    .from(loansTable)
    .leftJoin(farmersTable, eq(loansTable.farmerId, farmersTable.id))
    .where(eq(loansTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  res.json(GetLoanResponse.parse(
    serializeLoan(row.loan as unknown as Record<string, unknown>, row.farmerName, row.farmerPhone),
  ));
});

router.post("/loans/:id/disburse", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DisburseLoanParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ loan: loansTable, farmer: farmersTable })
    .from(loansTable)
    .leftJoin(farmersTable, eq(loansTable.farmerId, farmersTable.id))
    .where(eq(loansTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  if (row.loan.status !== "approved") {
    res.status(400).json({ error: "Loan is not in approved status" });
    return;
  }

  const result = await b2cDisbursement(
    row.farmer?.phone ?? "",
    Number(row.loan.amount),
    `AgriPride loan disbursement for ${row.farmer?.name}`,
  );

  await db.update(loansTable)
    .set({ status: "disbursed", disbursedAt: new Date() })
    .where(eq(loansTable.id, params.data.id));

  res.json(DisburseLoanResponse.parse({
    message: "Disbursement initiated via M-Pesa",
    conversationId: result.ConversationID ?? `sim-${Date.now()}`,
  }));
});

router.get("/loans/:id/repayments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListRepaymentsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db.select().from(repaymentsTable)
    .where(eq(repaymentsTable.loanId, params.data.id))
    .orderBy(repaymentsTable.paidAt);

  res.json(ListRepaymentsResponse.parse(rows.map(r => ({
    ...r,
    amount: Number(r.amount),
    paidAt: r.paidAt.toISOString(),
  }))));
});

router.post("/loans/:id/repay", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = InitiateRepaymentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = InitiateRepaymentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, params.data.id));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  const result = await stkPush(
    body.data.phone,
    body.data.amount,
    `LOAN-${params.data.id}`,
    "AgriPride Loan Repayment",
  );

  res.json(InitiateRepaymentResponse.parse({
    message: "STK push sent — check your phone to complete payment",
    checkoutRequestId: result.CheckoutRequestID ?? `sim-${Date.now()}`,
  }));
});

export default router;
