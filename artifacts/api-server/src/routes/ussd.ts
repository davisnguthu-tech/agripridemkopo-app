import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, farmersTable, loanApplicationsTable, loansTable, ussdSessionsTable } from "@workspace/db";
import { sendSms } from "../lib/africastalking";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type UssdState =
  | "main_menu"
  | "apply_national_id"
  | "apply_amount"
  | "apply_purpose"
  | "check_status"
  | "repay_amount"
  | "register_name"
  | "register_county"
  | "register_farm_size"
  | "register_crop";

interface SessionData {
  nationalId?: string;
  amount?: number;
  purpose?: string;
  name?: string;
  county?: string;
}

function purposeLabel(idx: string): string {
  const map: Record<string, string> = {
    "1": "Seeds & Fertilizer",
    "2": "Equipment Purchase",
    "3": "Irrigation Setup",
    "4": "Harvest & Storage",
  };
  return map[idx] ?? "General Agricultural Use";
}

router.post("/ussd", async (req, res): Promise<void> => {
  res.setHeader("Content-Type", "text/plain");

  const { sessionId, phoneNumber, text } = req.body as {
    sessionId: string;
    phoneNumber: string;
    text: string;
  };

  const parts = text.split("*");
  const input = parts[parts.length - 1];

  // Get or create session
  let [session] = await db.select().from(ussdSessionsTable).where(eq(ussdSessionsTable.sessionId, sessionId));

  if (!session) {
    [session] = await db.insert(ussdSessionsTable).values({
      sessionId,
      phone: phoneNumber,
      state: "main_menu",
      data: {},
    }).returning();
  }

  const state = session.state as UssdState;
  const data = (session.data ?? {}) as SessionData;

  // Helper to advance state
  async function advance(newState: UssdState, extraData: Partial<SessionData> = {}) {
    await db.update(ussdSessionsTable)
      .set({ state: newState, data: { ...data, ...extraData } })
      .where(eq(ussdSessionsTable.sessionId, sessionId));
  }

  // Find farmer by phone
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.phone, phoneNumber));

  // ─── State machine ─────────────────────────────────────────────────────────
  if (state === "main_menu" || text === "") {
    const greeting = farmer ? `Welcome back, ${farmer.name.split(" ")[0]}!` : "Welcome to AgriPride Mkopo";
    res.send(`CON ${greeting}\n1. Apply for Loan\n2. Check Loan Status\n3. Make Repayment\n4. Register Account`);
    return;
  }

  if (state === "main_menu") {
    if (input === "1") {
      if (!farmer) {
        res.send("END Please register first by dialing back and selecting option 4.");
        return;
      }
      await advance("apply_amount");
      res.send("CON Enter loan amount in KES (e.g. 5000):");
      return;
    }
    if (input === "2") {
      await advance("check_status");
      const apps = await db.select().from(loanApplicationsTable)
        .where(eq(loanApplicationsTable.farmerId, farmer?.id ?? -1))
        .orderBy(loanApplicationsTable.createdAt)
        .limit(3);
      if (!farmer || apps.length === 0) {
        res.send("END No loan applications found for your number.");
        return;
      }
      const lines = apps.map(a => `${a.id}. KES ${Number(a.amountRequested).toLocaleString()} - ${a.status.toUpperCase()}`).join("\n");
      res.send(`END Your Applications:\n${lines}`);
      return;
    }
    if (input === "3") {
      if (!farmer) {
        res.send("END Please register first.");
        return;
      }
      const [activeLoan] = await db.select().from(loansTable)
        .where(eq(loansTable.farmerId, farmer.id));
      if (!activeLoan) {
        res.send("END You have no active loans to repay.");
        return;
      }
      await advance("repay_amount", { amount: activeLoan.id });
      const outstanding = Number(activeLoan.amount) - Number(activeLoan.amountPaid);
      res.send(`CON Loan #${activeLoan.id}\nOutstanding: KES ${outstanding.toLocaleString()}\nEnter repayment amount:`);
      return;
    }
    if (input === "4") {
      await advance("register_name");
      res.send("CON Enter your full name:");
      return;
    }
    res.send("END Invalid option. Please try again.");
    return;
  }

  if (state === "apply_amount") {
    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount < 1000 || amount > 500000) {
      res.send("CON Invalid amount. Enter between KES 1,000 and 500,000:");
      return;
    }
    await advance("apply_purpose", { amount });
    res.send("CON Select loan purpose:\n1. Seeds & Fertilizer\n2. Equipment Purchase\n3. Irrigation Setup\n4. Harvest & Storage");
    return;
  }

  if (state === "apply_purpose") {
    if (!["1", "2", "3", "4"].includes(input)) {
      res.send("CON Invalid. Select:\n1. Seeds & Fertilizer\n2. Equipment\n3. Irrigation\n4. Harvest");
      return;
    }
    const purpose = purposeLabel(input);
    if (!farmer) {
      res.send("END Session error. Please try again.");
      return;
    }
    // Create the application
    const [app] = await db.insert(loanApplicationsTable).values({
      farmerId: farmer.id,
      amountRequested: String(data.amount ?? 0),
      purpose,
      status: "pending",
    }).returning();

    logger.info({ appId: app.id, farmerId: farmer.id }, "USSD loan application created");

    await sendSms(
      phoneNumber,
      `AgriPride: Your loan application of KES ${(data.amount ?? 0).toLocaleString()} for ${purpose} (Ref: APP-${app.id}) has been received. We will review and respond within 24 hours.`,
    );

    // Reset session
    await db.update(ussdSessionsTable)
      .set({ state: "main_menu", data: {} })
      .where(eq(ussdSessionsTable.sessionId, sessionId));

    res.send(`END Application received!\nRef: APP-${app.id}\nAmount: KES ${(data.amount ?? 0).toLocaleString()}\nPurpose: ${purpose}\n\nYou will receive an SMS with our decision.`);
    return;
  }

  if (state === "register_name") {
    if (!input || input.length < 2) {
      res.send("CON Enter your full name (at least 2 characters):");
      return;
    }
    await advance("register_county", { name: input });
    res.send("CON Enter your county (e.g. Nakuru, Kisumu, Nairobi):");
    return;
  }

  if (state === "register_county") {
    await advance("register_farm_size", { county: input });
    res.send("CON Enter your farm size in acres (e.g. 2.5):");
    return;
  }

  if (state === "register_farm_size") {
    const size = parseFloat(input);
    if (isNaN(size) || size <= 0) {
      res.send("CON Invalid size. Enter farm size in acres:");
      return;
    }
    await advance("register_crop", { amount: size });
    res.send("CON Select main crop:\n1. Maize\n2. Tea\n3. Coffee\n4. Vegetables\n5. Sugarcane\n6. Other");
    return;
  }

  if (state === "register_crop") {
    const cropMap: Record<string, string> = {
      "1": "Maize", "2": "Tea", "3": "Coffee",
      "4": "Vegetables", "5": "Sugarcane", "6": "Other",
    };
    const crop = cropMap[input] ?? "Other";

    await db.insert(farmersTable).values({
      phone: phoneNumber,
      name: data.name ?? "Unknown",
      nationalId: `USSD-${Date.now()}`,
      county: data.county ?? "Unknown",
      farmSizeAcres: String(data.amount ?? 1),
      cropType: crop,
    }).onConflictDoNothing();

    await db.update(ussdSessionsTable)
      .set({ state: "main_menu", data: {} })
      .where(eq(ussdSessionsTable.sessionId, sessionId));

    res.send(`END Registration complete!\nName: ${data.name}\nCounty: ${data.county}\nCrop: ${crop}\n\nDial again to apply for a loan.`);
    return;
  }

  res.send("END Session expired. Please dial again.");
});

export default router;
