// app/api/ai/sql/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { neon } from "@neondatabase/serverless";

// ------------------- Initialize Neon & Gemini -------------------
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set!");
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set!");

const sql = neon(process.env.DATABASE_URL!);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ------------------- Prisma schema (for AI prompt) -------------------
const prismaSchema = `
// Prisma schema goes here
// You can copy/paste your full schema from earlier
`;

// ------------------- Helper: Normalize SQL -------------------
function normalizeSQLIdentifiers(query: string) {
  // Convert quoted identifiers to lowercase
  return query.replace(/"([A-Za-z_][A-Za-z0-9_]*)"/g, (_, name) =>
    name.toLowerCase()
  );
}

// ------------------- API Route -------------------
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // ------------------- Step 1: Generate SQL via Gemini -------------------
    const sqlPrompt = `
You are an expert AI that translates natural language into SQL for PostgreSQL.
Do not explain anything, only return a valid SQL query ending with a semicolon.
Inline all values directly; do NOT use $1, $2 placeholders.
Always use lowercase table names and column names.

Prisma schema:
${prismaSchema}

User's request: "${query}"
`;

    const sqlResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: sqlPrompt,
    });

    const generatedSql = sqlResponse.text ?? "";
    if (!generatedSql) {
      return NextResponse.json(
        { error: "Gemini did not return SQL" },
        { status: 500 }
      );
    }

    // ------------------- Step 2: Normalize SQL for Neon -------------------
    const normalizedSql = normalizeSQLIdentifiers(generatedSql);

    // ------------------- Step 3: Execute SQL -------------------
    // ------------------- Step 3: Execute SQL -------------------
    let rows: any[] = [];
    try {
      const result: any = await sql.query(normalizedSql); // <- use `any`

      // Neon query can return:
      // 1. An array of rows
      // 2. { rows: [...] }
      // 3. Single object
      if (Array.isArray(result)) {
        rows = result.flatMap((r) => (Array.isArray(r) ? r : [r]));
      } else if (result && typeof result === "object" && "rows" in result) {
        rows = (result as { rows: any[] }).rows;
      } else {
        rows = [result];
      }
    } catch (err: any) {
      return NextResponse.json(
        {
          error: "SQL execution failed",
          details: err.message,
          sqlQuery: normalizedSql,
        },
        { status: 400 }
      );
    }

    // ------------------- Step 4: Send SQL result back to Gemini -------------------
    const explanationPrompt = `
You are an expert AI assistant.

The user asked: "${query}"
The generated SQL query: "${generatedSql}"
The result of the SQL query is: ${JSON.stringify(rows, null, 2)}

Explain the SQL query and results in a clear and concise way, adding any useful insights.
`;

    const explanationResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: explanationPrompt,
    });

    const geminiResult = explanationResponse.text ?? "No explanation returned.";

    // ------------------- Step 5: Return final JSON -------------------
    return NextResponse.json({
      userQuery: query,
      sqlQuery: generatedSql,
      queryResult: rows,
      geminiResult,
    });
  } catch (err: any) {
    console.error("POST /api/ai/sql error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
