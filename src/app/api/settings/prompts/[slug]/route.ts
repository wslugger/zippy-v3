import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIPromptSchema } from "@/lib/types";

/** GET /api/settings/prompts/[slug] — fetch single prompt */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const prompt = await prisma.aIPrompt.findUnique({ where: { slug } });
        if (!prompt) {
            // Return a default prompt scaffold instead of 404
            return NextResponse.json({
                slug,
                displayName: slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                model: "gemini-3-flash-preview",
                temperature: 0.1,
                systemInstruction: "",
                userPromptTemplate: ""
            });
        }
        return NextResponse.json(prompt);
    } catch (err) {
        console.error("GET /api/settings/prompts/[slug] error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PUT /api/settings/prompts/[slug] — update a prompt */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const parsed = AIPromptSchema.partial().safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const prompt = await prisma.aIPrompt.upsert({
            where: { slug },
            update: parsed.data,
            create: {
                slug,
                displayName: slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                model: parsed.data.model ?? "gemini-3-flash-preview",
                temperature: parsed.data.temperature ?? 0.1,
                systemInstruction: parsed.data.systemInstruction ?? "",
                userPromptTemplate: parsed.data.userPromptTemplate ?? ""
            }
        });
        return NextResponse.json(prompt);
    } catch (err) {
        console.error("PUT /api/settings/prompts/[slug] error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/settings/prompts/[slug] — delete a prompt */
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        await prisma.aIPrompt.delete({ where: { slug } });
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /api/settings/prompts/[slug] error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
