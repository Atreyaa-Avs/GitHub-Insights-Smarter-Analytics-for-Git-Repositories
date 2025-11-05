import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import FormDataNode from "form-data";
import fs from "fs";
import axios from "axios";
import path from "path";
import os from "os";

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ------------------- Helper: normalize issue -------------------
function normalizeIssue(i: any) {
  return {
    number: i.issue_number || i.number,
    title: i.title || "No title",
    state: i.state || "open",
    created_at:
      i.created_at instanceof Date
        ? i.created_at.toISOString()
        : new Date(i.created_at).toISOString(),
    updated_at:
      i.updated_at instanceof Date
        ? i.updated_at.toISOString()
        : new Date(i.updated_at).toISOString(),
    closed_at: i.closed_at ? new Date(i.closed_at).toISOString() : null,
    author: i.author_login
      ? { login: i.author_login }
      : i.user
      ? { login: i.user.login }
      : { login: "Unknown" },
  };
}

// ------------------- Helper: OCR PDF -------------------
async function parsePdfWithOCR(filePath: string) {
  const form = new FormDataNode();
  form.append("file", fs.createReadStream(filePath));
  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("filetype", "PDF");

  const response = await axios.post("https://api.ocr.space/parse/image", form, {
    headers: {
      apikey: process.env.OCR_SPACE_API_KEY!,
      ...form.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (response.data.ParsedResults) {
    return response.data.ParsedResults.map((p: any) => p.ParsedText).join(
      "\n\n"
    );
  } else {
    console.error("OCR failed:", response.data);
    throw new Error("Failed to parse PDF via OCR.space");
  }
}

// ------------------- POST: Submit resume PDF + repo -------------------
export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await req.formData();
    const pdfFile = formData.get("resumePdf") as File;
    const repoUrl = formData.get("repoUrl") as string;

    if (!pdfFile)
      return NextResponse.json(
        { error: "Resume PDF is required" },
        { status: 400 }
      );
    if (!repoUrl || !repoUrl.includes("/"))
      return NextResponse.json(
        { error: "Valid repoUrl is required (owner/repo)" },
        { status: 400 }
      );

    const [owner, name] = repoUrl.split("/");

    // Fetch repo
    const repo = await prisma.repo.findUnique({
      where: { owner_name: { owner, name } },
    });
    if (!repo)
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });

    // Fetch open issues
    const issuesRaw = await prisma.issue.findMany({
      where: { repo_id: repo.id, state: "open" },
      orderBy: { created_at: "desc" },
      take: 50,
    });
    if (!issuesRaw || issuesRaw.length === 0)
      return NextResponse.json(
        { error: "No open issues found" },
        { status: 404 }
      );

    const issues = issuesRaw.map(normalizeIssue);

    // ------------------- Save PDF temporarily -------------------
    tempFilePath = path.join(os.tmpdir(), pdfFile.name);
    const arrayBuffer = await pdfFile.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

    // ------------------- OCR -------------------
    const resumeText = await parsePdfWithOCR(tempFilePath);

    // ------------------- Gemini AI -------------------
    const prompt = `
You are an expert GitHub open source mentor.

Analyze the following resume carefully, considering all aspects including:
- Skills and technologies
- Previous projects and achievements
- Work experience and contributions
- Education and certifications
- Any other relevant information

Then, examine the list of open issues in the GitHub repository ${repoUrl}.  

For each issue, determine:
1. Whether the person (referred to as "you") has the skills and experience to contribute.
2. How their background makes them suitable for the issue.
3. Provide a short reasoning for each matched issue.
4. Include a direct link to the issue.

Do not mention the person's name; always use 'you'.  

Resume Text:
${resumeText}

Open Issues:
${JSON.stringify(issues, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // ------------------- Delete temp file after success -------------------
    if (tempFilePath && fs.existsSync(tempFilePath))
      fs.unlinkSync(tempFilePath);

    return NextResponse.json({ matchedIssues: response.text });
  } catch (error: any) {
    // Delete temp file in case of error
    if (tempFilePath && fs.existsSync(tempFilePath))
      fs.unlinkSync(tempFilePath);

    console.error("POST /api/contribute error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
