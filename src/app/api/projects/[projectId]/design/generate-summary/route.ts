import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/gemini";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await request.json();
        const { designConfiguration } = body;

        if (!designConfiguration) {
            return NextResponse.json(
                { error: "designConfiguration is required" },
                { status: 400 }
            );
        }

        // 1. Fetch Project and Customer Requirements
        const [project, requirements] = await Promise.all([
            prisma.project.findUnique({
                where: { id: projectId },
            }),
            prisma.customerRequirement.findMany({
                where: { projectId },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Combine all requirements into a single string
        const reqText = requirements.map((r) => r.rawText).join("\n\n");

        // 2. Fetch the prompt template from the database
        let promptConfig = await prisma.aIPrompt.findUnique({
            where: { slug: "design_exec_summary" },
        });

        if (!promptConfig) {
            // Fallback prompt config if missing in db
            promptConfig = {
                id: "fallback",
                slug: "design_exec_summary",
                displayName: "Executive Summary Generator",
                model: "gemini-2.5-flash",
                temperature: 0.2,
                systemInstruction: "You are a senior pre-sales network engineer. You write professional, concise executive summaries and conclusions for customer design configurations.",
                userPromptTemplate: "Write a high-level executive summary and a separate conclusion based on the following configurations and customer requirements. Focus on business value and technical alignment.\n\nCustomer Requirements:\n{{customer_requirements}}\n\nDesign Configuration:\n{{design_configuration}}\n\nOutput ONLY JSON in this format: { \"execSummary\": \"...\", \"conclusion\": \"...\" }",
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        // 3. Prepare the final prompt by replacing placeholders
        const userPrompt = promptConfig.userPromptTemplate
            .replace("{{customer_requirements}}", reqText || "None available")
            .replace("{{design_configuration}}", JSON.stringify(designConfiguration, null, 2));

        const aiTextOutput = await callGemini({
            model: promptConfig.model,
            temperature: promptConfig.temperature,
            systemInstruction: promptConfig.systemInstruction,
            userPrompt: userPrompt,
            responseMimeType: "application/json",
        });

        let jsonStr = aiTextOutput.replace(/```json\n|\n```/g, "").trim();

        // Extract the JSON object by finding the first { and last }
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }

        let result;
        try {
            result = JSON.parse(jsonStr);
        } catch {
            console.error("[generate_exec_summary] Invalid JSON from AI:", jsonStr);
            return NextResponse.json({ error: "AI returned an unexpected format" }, { status: 502 });
        }
        console.log("[generate_exec_summary] raw AI result keys:", Object.keys(result));

        // Normalize keys — Gemini may use snake_case or different naming
        const normalized = {
            execSummary: result.execSummary || result.exec_summary || result.executive_summary || result.executiveSummary || "",
            conclusion: result.conclusion || result.Conclusion || "",
        };

        return NextResponse.json(normalized);
    } catch (error: any) {
        console.error("[generate_exec_summary_error]", error);
        return NextResponse.json(
            { error: "Failed to generate executive summary" },
            { status: 500 }
        );
    }
}
