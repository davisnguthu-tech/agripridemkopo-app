import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CreditScoreInput {
  farmerName: string;
  county: string;
  farmSizeAcres: number;
  cropType: string;
  amountRequested: number;
  purpose: string;
  existingLoans: number;
}

export async function runCreditScore(input: CreditScoreInput): Promise<{
  score: number;
  recommendation: string;
  factors: string[];
}> {
  const prompt = `You are an agricultural credit officer for a Kenyan microfinance institution. 
Evaluate this loan application and provide a credit score from 0-100.

Farmer Profile:
- Name: ${input.farmerName}
- County: ${input.county}
- Farm Size: ${input.farmSizeAcres} acres
- Crop Type: ${input.cropType}
- Loan Amount Requested: KES ${input.amountRequested.toLocaleString()}
- Purpose: ${input.purpose}
- Existing Active Loans: ${input.existingLoans}

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "recommendation": "<Approve|Approve with conditions|Reject> - <one sentence reason>",
  "factors": ["<factor 1>", "<factor 2>", "<factor 3>"]
}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = JSON.parse(resp.choices[0].message.content ?? "{}");
  return {
    score: Number(raw.score),
    recommendation: String(raw.recommendation),
    factors: Array.isArray(raw.factors) ? raw.factors : [],
  };
}
