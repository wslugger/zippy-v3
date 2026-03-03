import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIPromptSchema } from "@/lib/types";
import { z } from "zod";

/** GET /api/settings/prompts — list all prompts */
export async function GET() {
    try {
        const prompts = await prisma.aIPrompt.findMany({ orderBy: { displayName: "asc" } });
        return NextResponse.json(prompts);
    } catch (err: any) {
        console.error("GET /api/settings/prompts error:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

const CreatePromptSchema = AIPromptSchema.extend({
    slug: z.string().min(1).regex(/^[a-z0-9_]+$/, "slug must be lowercase with underscores"),
});

/** POST /api/settings/prompts — create a new prompt */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreatePromptSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const existing = await prisma.aIPrompt.findUnique({ where: { slug: parsed.data.slug } });
        if (existing) {
            return NextResponse.json({ error: "A prompt with this slug already exists" }, { status: 409 });
        }

        const prompt = await prisma.aIPrompt.create({ data: parsed.data });
        return NextResponse.json(prompt, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/settings/prompts error:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
