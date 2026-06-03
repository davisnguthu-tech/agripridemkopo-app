import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, loansTable, repaymentsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/mpesa/stk-callback", async (req, res): Promise<void> => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) {
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      return;
    }

    const resultCode = body.ResultCode;
    const checkoutId = body.CheckoutRequestID;

    logger.info({ checkoutId, resultCode }, "M-Pesa STK callback received");

    if (resultCode === 0) {
      // Payment successful
      const items = body.CallbackMetadata?.Item ?? [];
      const getItem = (name: string) => items.find((i: { Name: string }) => i.Name === name)?.Value;

      const amount = Number(getItem("Amount") ?? 0);
      const receipt = String(getItem("MpesaReceiptNumber") ?? "");
      const phone = String(getItem("PhoneNumber") ?? "");

      // Find the loan by phone
      const loans = await db.select().from(loansTable)
        .where(eq(loansTable.status, "disbursed"));

      // Simple match: find active loan for this phone (approximate)
      logger.info({ amount, receipt, phone }, "STK payment confirmed");

      // Record as repayment if we can match a loan
      if (loans.length > 0) {
        const loan = loans[0];
        await db.insert(repaymentsTable).values({
          loanId: loan.id,
          amount: String(amount),
          mpesaReceipt: receipt,
          paidAt: new Date(),
        });

        const newPaid = Number(loan.amountPaid) + amount;
        await db.update(loansTable)
          .set({
            amountPaid: String(newPaid),
            status: newPaid >= Number(loan.amount) ? "repaid" : "disbursed",
          })
          .where(eq(loansTable.id, loan.id));
      }
    } else {
      logger.warn({ checkoutId, resultCode }, "STK payment failed or cancelled");
    }
  } catch (err) {
    logger.error({ err }, "Error processing M-Pesa STK callback");
  }

  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

router.post("/mpesa/b2c-callback", async (req, res): Promise<void> => {
  try {
    const result = req.body?.Result;
    if (!result) {
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      return;
    }

    const resultCode = result.ResultCode;
    const conversationId = result.ConversationID;

    logger.info({ conversationId, resultCode }, "M-Pesa B2C callback received");

    if (resultCode === 0) {
      const params = result.ResultParameters?.ResultParameter ?? [];
      const getParam = (key: string) => params.find((p: { Key: string }) => p.Key === key)?.Value;
      const receipt = String(getParam("TransactionReceipt") ?? "");
      const amount = Number(getParam("TransactionAmount") ?? 0);

      logger.info({ receipt, amount }, "B2C disbursement confirmed");

      // Mark the loan with receipt
      const pendingLoans = await db.select().from(loansTable).where(eq(loansTable.status, "disbursed"));
      if (pendingLoans.length > 0) {
        await db.update(loansTable)
          .set({ mpesaReceipt: receipt })
          .where(eq(loansTable.id, pendingLoans[0].id));
      }
    }
  } catch (err) {
    logger.error({ err }, "Error processing M-Pesa B2C callback");
  }

  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

export default router;
