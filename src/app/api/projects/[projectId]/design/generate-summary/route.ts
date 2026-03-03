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
                systemInstruction: "You are a senior pre-sales network engineer. You write professional, concise executive summaries for customer design configurations.",
                userPromptTemplate: "Write a high-level executive summary based on the following configurations and customer requirements. Focus on business value and technical alignment. Maximum 3 paragraphs. Do not write anything outside of the requested summary.\n\nCustomer Requirements:\n{{customer_requirements}}\n\nDesign Configuration:\n{{design_configuration}}",
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        // 3. Prepare the final prompt by replacing placeholders
        const userPrompt = promptConfig.userPromptTemplate
            .replace("{{customer_requirements}}", reqText || "None available")
            .replace("{{design_configuration}}", JSON.stringify(designConfiguration, null, 2));

        // 4. Call Gemini
        const aiTextOutput = await callGemini({
            model: promptConfig.model,
            temperature: promptConfig.temperature,
            systemInstruction: promptConfig.systemInstruction,
            userPrompt: userPrompt,
        });

        return NextResponse.json({ execSummary: aiTextOutput.trim() });
    } catch (error: any) {
        console.error("[generate_exec_summary_error]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate executive summary" },
            { status: 500 }
        );
    }
}
