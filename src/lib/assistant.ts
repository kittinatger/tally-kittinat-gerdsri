import { Type, type FunctionCall, type Tool } from "@google/genai";
import { getClient, withGeminiFallback } from "@/lib/gemini";
import { getSpendingByCategory, getSpendingTotal, getTopMerchants } from "@/lib/spending-queries";

// The in-app spending assistant answers questions like "how much did I
// spend on food this month" by giving Gemini function-calling access to
// real SQL aggregates (spending-queries.ts) instead of letting it reason
// over — and potentially hallucinate — numbers itself. Every figure in the
// final answer traces back to one of these three tool calls, executed
// server-side and scoped to the asking user's own data.
const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getSpendingByCategory",
        description: "Get total spending (or income) broken down by category, for a date range.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            from: { type: Type.STRING, description: "Start date, YYYY-MM-DD, inclusive." },
            to: { type: Type.STRING, description: "End date, YYYY-MM-DD, inclusive." },
            type: { type: Type.STRING, enum: ["expense", "income"] },
          },
          required: ["from", "to"],
        },
      },
      {
        name: "getSpendingTotal",
        description: "Get the total spending (or income) across all categories, for a date range.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            from: { type: Type.STRING, description: "Start date, YYYY-MM-DD, inclusive." },
            to: { type: Type.STRING, description: "End date, YYYY-MM-DD, inclusive." },
            type: { type: Type.STRING, enum: ["expense", "income"] },
          },
          required: ["from", "to"],
        },
      },
      {
        name: "getTopMerchants",
        description: "Get the merchants/payees with the highest total spending in a date range, most spent first.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            from: { type: Type.STRING, description: "Start date, YYYY-MM-DD, inclusive." },
            to: { type: Type.STRING, description: "End date, YYYY-MM-DD, inclusive." },
            limit: { type: Type.NUMBER, description: "Max merchants to return, default 5." },
          },
          required: ["from", "to"],
        },
      },
    ],
  },
];

async function runTool(userId: number, call: FunctionCall): Promise<unknown> {
  const args = call.args ?? {};
  switch (call.name) {
    case "getSpendingByCategory":
      return getSpendingByCategory(
        userId,
        String(args.from),
        String(args.to),
        args.type === "income" ? "income" : "expense",
      );
    case "getSpendingTotal":
      return getSpendingTotal(userId, String(args.from), String(args.to), args.type === "income" ? "income" : "expense");
    case "getTopMerchants":
      return getTopMerchants(userId, String(args.from), String(args.to), typeof args.limit === "number" ? args.limit : 5);
    default:
      return { error: `Unknown tool: ${call.name}` };
  }
}

export async function askAssistant(userId: number, question: string, todayIso: string): Promise<{ answer: string; model: string }> {
  const ai = getClient();
  const systemInstruction = `You are a spending assistant inside a personal finance app. Answer the user's question about their own transactions using the tools provided — never guess or estimate a number yourself, always call a tool to get it. Today's date is ${todayIso}; resolve relative time ranges ("this month", "last week", "this year") against it. Keep answers short (1-3 sentences), state amounts plainly (assume the user's own currency, don't add a currency symbol since you don't know which one), and if a tool returns no data, say so directly instead of making something up.`;

  // The whole two-step tool-calling exchange runs against whichever single
  // model withGeminiFallback picks — never split across models mid-
  // conversation (the second call's `contents` includes the first call's
  // raw functionCall parts, which needs one consistent model on both ends).
  const { result: answer, model } = await withGeminiFallback(async (model) => {
    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [
      { role: "user", parts: [{ text: question }] },
    ];

    const first = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction, tools: TOOLS },
    });

    const calls = first.functionCalls;
    if (!calls || calls.length === 0) {
      return first.text ?? "Sorry, I couldn't come up with an answer to that.";
    }

    // Single round of tool calls — enough for every question this assistant
    // is meant to answer (spending/income totals, category breakdowns, top
    // merchants); not a general multi-step agent loop.
    const responseParts = await Promise.all(
      calls.map(async (call) => ({
        functionResponse: { name: call.name, response: { result: await runTool(userId, call) } },
      })),
    );

    contents.push(
      { role: "model", parts: calls.map((call) => ({ functionCall: call })) },
      { role: "user", parts: responseParts },
    );

    const second = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction, tools: TOOLS },
    });

    return second.text ?? "Sorry, I couldn't come up with an answer to that.";
  });

  return { answer, model };
}
