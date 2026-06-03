import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { applicantProfiles, applicantApplications } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function requireApplicantAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.clerkUserId = auth.userId;
  next();
}

router.get("/applicant/profile", requireApplicantAuth, async (req: any, res) => {
  const [profile] = await db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.clerkUserId, req.clerkUserId))
    .limit(1);
  res.json(profile ?? null);
});

router.post("/applicant/profile", requireApplicantAuth, async (req: any, res) => {
  const { name, phone, nationalId, county, farmSizeAcres, cropType } = req.body;
  const existing = await db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.clerkUserId, req.clerkUserId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(applicantProfiles)
      .set({ name, phone, nationalId, county, farmSizeAcres, cropType, updatedAt: new Date() })
      .where(eq(applicantProfiles.clerkUserId, req.clerkUserId))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(applicantProfiles)
      .values({ clerkUserId: req.clerkUserId, name, phone, nationalId, county, farmSizeAcres, cropType })
      .returning();
    res.json(created);
  }
});

router.get("/applicant/applications", requireApplicantAuth, async (req: any, res) => {
  const apps = await db
    .select()
    .from(applicantApplications)
    .where(eq(applicantApplications.clerkUserId, req.clerkUserId))
    .orderBy(applicantApplications.createdAt);
  res.json(apps.reverse());
});

router.get("/applicant/applications/:id", requireApplicantAuth, async (req: any, res) => {
  const [app] = await db
    .select()
    .from(applicantApplications)
    .where(eq(applicantApplications.id, parseInt(req.params.id, 10)))
    .limit(1);
  if (!app || app.clerkUserId !== req.clerkUserId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(app);
});

router.post("/applicant/applications", requireApplicantAuth, async (req: any, res) => {
  const { amountRequested, purpose, county, farmSizeAcres, cropType, monthlyIncome, existingDebt } = req.body;

  const [profile] = await db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.clerkUserId, req.clerkUserId))
    .limit(1);

  const [app] = await db
    .insert(applicantApplications)
    .values({
      clerkUserId: req.clerkUserId,
      applicantName: profile?.name ?? null,
      phone: profile?.phone ?? null,
      amountRequested,
      purpose,
      county,
      farmSizeAcres,
      cropType,
      monthlyIncome: monthlyIncome ?? null,
      existingDebt: existingDebt ?? "0",
      status: "reviewing",
    })
    .returning();

  res.json(app);

  runAIReview(app.id, {
    applicantName: profile?.name ?? "Applicant",
    amountRequested,
    purpose,
    county,
    farmSizeAcres,
    cropType,
    monthlyIncome,
    existingDebt: existingDebt ?? 0,
  }).catch((err) => {
    console.error("AI review failed for application", app.id, err);
  });
});

async function runAIReview(appId: number, data: {
  applicantName: string;
  amountRequested: number | string;
  purpose: string;
  county: string;
  farmSizeAcres: number | string;
  cropType: string;
  monthlyIncome?: number | string;
  existingDebt?: number | string;
}) {
  const ctx = `
Applicant: ${data.applicantName}
Loan Amount Requested: KES ${data.amountRequested}
Loan Purpose: ${data.purpose}
County: ${data.county}
Farm Size: ${data.farmSizeAcres} acres
Primary Crop: ${data.cropType}
Estimated Monthly Income: KES ${data.monthlyIncome ?? "Not specified"}
Existing Debt: KES ${data.existingDebt ?? 0}
`.trim();

  let a1Score = 50;
  let a1Review = "Unable to assess.";
  let a2Score = 50;
  let a2Review = "Unable to assess.";

  try {
    const r1 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Agent 1: Credit Risk Assessor for AgriPride Mkopo, a Kenyan agricultural lender. 
Evaluate the applicant's repayment capacity based on: loan-to-income ratio, existing debt burden, and financial stability indicators.
Be realistic about Kenyan smallholder farmer income levels.
Return valid JSON only: { "score": <integer 0-100>, "review": "<2-3 sentences assessing credit risk>" }`,
        },
        { role: "user", content: ctx },
      ],
      response_format: { type: "json_object" },
    });
    const a1 = JSON.parse(r1.choices[0].message.content ?? "{}");
    a1Score = Number(a1.score) || 50;
    a1Review = String(a1.review || "Assessment unavailable.");
  } catch {}

  try {
    const r2 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Agent 2: Agricultural Context Analyst for AgriPride Mkopo, a Kenyan agricultural lender.
Evaluate the farming operation's viability: Is the crop type suitable for the stated county? Is the farm size adequate for the crop? Does the loan purpose align with the crop cycle? Consider Kenyan agricultural conditions.
Return valid JSON only: { "score": <integer 0-100>, "review": "<2-3 sentences assessing agricultural viability>" }`,
        },
        { role: "user", content: ctx },
      ],
      response_format: { type: "json_object" },
    });
    const a2 = JSON.parse(r2.choices[0].message.content ?? "{}");
    a2Score = Number(a2.score) || 50;
    a2Review = String(a2.review || "Assessment unavailable.");
  } catch {}

  let finalScore = Math.round((a1Score + a2Score) / 2);
  let finalDecision = finalScore >= 60 ? "approved" : "rejected";
  let finalReason = "Review incomplete.";

  try {
    const r3 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Agent 3: Final Decision Authority for AgriPride Mkopo, a Kenyan agricultural lender.
You have received credit risk and agricultural viability assessments. Make the final lending decision.
Approve if combined score >= 60, reject if below 60.
Write the reason directly to the applicant in plain English — be kind but honest. If rejecting, give specific, actionable reasons they can address.
Return valid JSON only: { "finalScore": <integer 0-100>, "decision": "approved" | "rejected", "reason": "<2-4 sentences addressed to the applicant>" }`,
        },
        {
          role: "user",
          content: `${ctx}\n\nAgent 1 — Credit Risk (Score: ${a1Score}/100):\n${a1Review}\n\nAgent 2 — Agricultural Viability (Score: ${a2Score}/100):\n${a2Review}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const a3 = JSON.parse(r3.choices[0].message.content ?? "{}");
    finalScore = Number(a3.finalScore) || finalScore;
    finalDecision = a3.decision === "approved" ? "approved" : "rejected";
    finalReason = String(a3.reason || finalReason);
  } catch {}

  await db
    .update(applicantApplications)
    .set({
      agent1Score: a1Score,
      agent1Review: a1Review,
      agent2Score: a2Score,
      agent2Review: a2Review,
      finalScore,
      finalDecision,
      finalReason,
      status: finalDecision,
      reviewedAt: new Date(),
    })
    .where(eq(applicantApplications.id, appId));
}

export default router;
