import { Router } from "express";
import { getAuth } from "@clerk/express";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the AgriPride Mkopo Financial Coach — a friendly, knowledgeable AI advisor for smallholder farmers in Kenya.

Your role:
- Answer questions about AgriPride Mkopo's agricultural loan products
- Give practical financial advice tailored to Kenyan smallholder farmers
- Help borrowers understand loan terms, repayment strategies, and M-Pesa payments
- Advise on how to improve loan approval chances
- Explain the AI review process (3 agents: Credit Risk, Agricultural Analyst, Final Decision)
- Answer in both English and Swahili — respond in whatever language the user writes in
- Be warm, encouraging, and clear — many users may have limited financial literacy

AgriPride Mkopo key facts:
- Loan range: KES 5,000 to KES 500,000
- Purpose: seeds & fertilizer, irrigation, equipment, harvest & storage, farm labour, livestock, land preparation
- Counties: all 47 counties of Kenya
- Review: 3 AI agents score the application (0–100 each), approve if average ≥ 60
- Repayment: via M-Pesa or USSD
- No physical paperwork required
- Sign-up is free

Tips to improve approval:
- Provide accurate monthly income information
- Keep existing debt low relative to income
- Choose a loan amount proportional to farm size
- Ensure the loan purpose matches the crop type
- Complete the farm profile fully before applying

Keep responses concise, friendly, and actionable. Use simple language. Avoid financial jargon without explanation.`;

router.post("/applicant/coach", async (req: any, res) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message required" });
    return;
  }

  const safeHistory = Array.isArray(history)
    ? history.slice(-10).filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
    : [];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: "user", content: message },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
  res.json({ reply });
});

export default router;
