import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateFeatureSchema = z.object({
    name: z.string().min(1).optional(),
    service: z.string().min(1).optional(),
    status: z.string().optional(),
    description: z.string().nullable().optional(),
    caveats: z.array(z.string()).optional(),
    assumptions: z.array(z.string()).optional(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const feature = await prisma.feature.findUnique({
            where: { id },
        });
        if (!feature) {
            return NextResponse.json({ error: "Feature not found" }, { status: 404 });
        }
        return NextResponse.json(feature);
    } catch (error) {
        console.error("GET /api/features/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch feature" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = UpdateFeatureSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }
        const feature = await prisma.feature.update({
            where: { id },
            data: parsed.data,
        });
        return NextResponse.json(feature);
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Feature not found" }, { status: 404 });
        }
        console.error("PUT /api/features/[id] error:", error);
        return NextResponse.json({ error: "Failed to update feature" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.feature.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Feature not found" }, { status: 404 });
        }
        console.error("DELETE /api/features/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete feature" }, { status: 500 });
    }
}
