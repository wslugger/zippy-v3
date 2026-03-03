import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/gemini";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // 1. Fetch Project, Requirements, and the Selected Package
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project || !project.selectedPackageId) {
            return NextResponse.json({ error: "Project or package not found" }, { status: 404 });
        }

        const [requirements, pkg] = await Promise.all([
            prisma.customerRequirement.findMany({
                where: { projectId },
            }),
            prisma.package.findUnique({
                where: { id: project.selectedPackageId },
            }),
        ]);

        if (!pkg) {
            return NextResponse.json({ error: "Package definition not found" }, { status: 404 });
        }

        // 2. Fetch full Service definitions for the included services to know what options exist
        const includedServices = pkg.includedServices as any[];
        const serviceIds = includedServices.map(is => is.serviceId);
        const services = await prisma.service.findMany({
            where: { id: { in: serviceIds } },
        });

        const reqText = requirements.map(r => r.rawText).join("\n\n");

        // 3. Prepare AI Prompt
        // We need to provide the AI with the available options in the package
        const designInventory = includedServices.map(is => {
            const sDef = services.find(s => s.id === is.serviceId);
            const sOps = (sDef?.serviceOptions as any[]) || [];
            return {
                serviceId: is.serviceId,
                serviceName: is.serviceName,
                availableOptions: is.includedOptions.map((io: any) => {
                    const oDef = sOps.find((so: any) => so.optionId === io.optionId);
                    return {
                        optionId: io.optionId,
                        name: oDef?.name,
                        description: oDef?.description,
                        designation: io.designation // required, standard, optional
                    };
                }),
                availableDesignChoices: is.includedDesignChoices.map((idc: any) => ({
                    groupId: idc.groupId,
                    choiceValue: idc.choiceValue,
                    designation: idc.designation
                }))
            };
        });

        const activePromptConfig = await prisma.aIPrompt.findUnique({
            where: { slug: "design_auto_select" },
        }) || {
            model: "gemini-2.5-flash",
            temperature: 0.1,
            systemInstruction: "You are an expert solution architect. Based on customer requirements and the available design options in a package, recommend the best configuration. REQUIRED options must always be selected. STANDARD options should be selected unless the requirements suggest they are not needed. OPTIONAL options should only be selected if the requirements explicitly suggest they are needed.",
            userPromptTemplate: "Analyze the following customer requirements and design inventory. Output a JSON object mapping each serviceId to the recommended selections. Include reasoning for each choice.\n\nCustomer Requirements:\n{{customer_requirements}}\n\nDesign Inventory:\n{{design_inventory}}\n\nOutput Format MUST be JSON:\n{\n  \"services\": [\n    {\n      \"serviceId\": \"...\",\n      \"selectedOptions\": [\"optId1\", \"optId2\"],\n      \"selectedDesignChoices\": { \"groupId1\": [\"val1\"] },\n      \"reasoning\": \"...\"\n    }\n  ]\n}",
        };

        const userPrompt = activePromptConfig.userPromptTemplate
            .replace("{{customer_requirements}}", reqText || "No explicit requirements provided.")
            .replace("{{design_inventory}}", JSON.stringify(designInventory, null, 2));

        const aiResponse = await callGemini({
            model: activePromptConfig.model,
            temperature: activePromptConfig.temperature,
            systemInstruction: activePromptConfig.systemInstruction,
            userPrompt: userPrompt,
            responseMimeType: "application/json",
        });

        // Parse AI JSON response
        // Sometimes Gemini wraps JSON in code blocks or prefixes it with text
        let jsonStr = aiResponse.replace(/```json\n|\n```/g, "").trim();
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }

        let recommendations;
        try {
            recommendations = JSON.parse(jsonStr);
        } catch {
            console.error("[AUTO_SELECT_ERROR] Invalid JSON from AI:", jsonStr);
            return NextResponse.json({ error: "AI returned an unexpected format" }, { status: 502 });
        }

        return NextResponse.json(recommendations);
    } catch (error: any) {
        console.error("[AUTO_SELECT_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
