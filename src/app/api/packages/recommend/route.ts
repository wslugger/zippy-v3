import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/doc-extract";
import { callGemini } from "@/lib/gemini";
import { AIRecommendationSchema } from "@/lib/types";



// Default prompt used if none found in DB
const DEFAULT_SYSTEM = "You are a Solutions Architect expert.";
const DEFAULT_TEMPLATE = `Analyze the following Customer Requirements and recommend the BEST fitting package from the available options.

AVAILABLE PACKAGES:
{packageSummaries}

{requirementsTextSection}

Output strictly in JSON format:
{
  "packageId": "string (must match one of the available IDs)",
  "confidence": number (0-100),
  "reasoning": "string (concise explanation)"
}`;

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") ?? "";

        let requirementsText = "";
        let projectId: string | null = null;
        const sources: { source: string; fileName?: string; rawText: string }[] = [];

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            projectId = formData.get("projectId") as string | null;
            const chatText = formData.get("chatText") as string | null;

            // Process uploaded files
            const files = formData.getAll("files") as File[];
            let successfulExtractions = 0;

            for (const file of files) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const text = await extractText(buffer, file.type, file.name);

                    if (text.trim()) {
                        successfulExtractions++;
                        sources.push({ source: "upload", fileName: file.name, rawText: text });
                        requirementsText += `\n[Document: ${file.name}]\n${text}\n`;
                    }
                } catch (extractErr: any) {
                    console.error(`Error extracting text from ${file.name}:`, extractErr.message);
                    // Continue with other files if one fails
                }
            }

            if (files.length > 0 && successfulExtractions === 0 && !chatText?.trim()) {
                return NextResponse.json({
                    error: `We couldn't extract any readable text from your ${files.length} document(s). Please try copy-pasting the requirements into the text box instead.`
                }, { status: 400 });
            }

            // Add chat text if provided alongside files
            if (chatText?.trim()) {
                sources.push({ source: "chat", rawText: chatText });
                requirementsText += `\n[Additional Requirements]\n${chatText}\n`;
            }
        } else {
            // JSON body (chat-only input)
            const body = await req.json();
            projectId = body.projectId ?? null;
            const chatText = body.chatText ?? "";
            requirementsText = chatText;
            if (chatText.trim()) {
                sources.push({ source: "chat", rawText: chatText });
            }
        }

        if (!requirementsText.trim()) {
            return NextResponse.json({ error: "No requirements provided" }, { status: 400 });
        }

        // Persist extracted requirements if we have a project
        if (projectId) {
            await prisma.customerRequirement.createMany({
                data: sources.map((s) => ({
                    projectId,
                    source: s.source,
                    fileName: s.fileName,
                    rawText: s.rawText,
                })),
            });
        }

        // Load packages
        const packages = await prisma.package.findMany({
            where: { isActive: true },
            select: { id: true, name: true, shortDescription: true, description: true, includedServices: true },
        });

        const packageSummaries = packages
            .map(
                (p) =>
                    `ID: ${p.id}\nName: ${p.name}\nDescription: ${p.shortDescription}\n${p.description}`
            )
            .join("\n---\n");

        // Load prompt from DB or fall back to defaults
        const promptConfig = await prisma.aIPrompt.findUnique({
            where: { slug: "package_selection" },
        });

        const model = promptConfig?.model ?? "gemini-3-flash-preview";
        const temperature = promptConfig?.temperature ?? 0.1;
        const systemInstruction = promptConfig?.systemInstruction ?? DEFAULT_SYSTEM;
        const userPromptTemplate = promptConfig?.userPromptTemplate ?? DEFAULT_TEMPLATE;

        const requirementsTextSection = `CUSTOMER REQUIREMENTS:\n${requirementsText.trim()}`;
        const userPrompt = userPromptTemplate
            .replace("{packageSummaries}", packageSummaries)
            .replace("{requirementsTextSection}", requirementsTextSection);

        // Call Gemini
        const rawResponse = await callGemini({ model, temperature, systemInstruction, userPrompt });

        // Parse strict JSON from Gemini response (strip markdown code fences if present)
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("Gemini raw response:", rawResponse);
            return NextResponse.json({ error: "AI returned an unexpected format" }, { status: 502 });
        }

        let rawParsed;
        try {
            rawParsed = JSON.parse(jsonMatch[0]);
        } catch {
            console.error("Gemini returned invalid JSON:", jsonMatch[0]);
            return NextResponse.json({ error: "AI returned an unexpected format" }, { status: 502 });
        }
        const parsed = AIRecommendationSchema.safeParse(rawParsed);
        if (!parsed.success) {
            console.error("AI recommendation parse error:", parsed.error, rawResponse);
            return NextResponse.json({ error: "AI response validation failed" }, { status: 502 });
        }

        return NextResponse.json(parsed.data);
    } catch (err) {
        console.error("POST /api/packages/recommend error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
