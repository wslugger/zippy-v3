import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateFeatureSchema = z.object({
    name: z.string().min(1),
    service: z.string().min(1),
    status: z.string().default("available"),
    description: z.string().nullable().optional(),
    caveats: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
});

export async function GET() {
    try {
        const features = await prisma.feature.findMany({
            orderBy: [{ service: "asc" }, { name: "asc" }],
        });
        return NextResponse.json(features);
    } catch (error) {
        console.error("GET /api/features error:", error);
        return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreateFeatureSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }
        const feature = await prisma.feature.create({
            data: parsed.data,
        });
        return NextResponse.json(feature, { status: 201 });
    } catch (error) {
        console.error("POST /api/features error:", error);
        return NextResponse.json({ error: "Failed to create feature" }, { status: 500 });
    }
}
