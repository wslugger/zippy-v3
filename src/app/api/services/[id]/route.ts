import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateServiceSchema = z.object({
    slug: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    constraints: z.array(z.string()).optional(),
    assumptions: z.array(z.string()).optional(),
    serviceOptions: z.array(z.any()).optional(),
    isActive: z.boolean().optional(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const service = await prisma.service.findUnique({
            where: { id },
        });
        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }
        return NextResponse.json(service);
    } catch (error) {
        console.error("GET /api/services/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = UpdateServiceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }
        const service = await prisma.service.update({
            where: { id },
            data: parsed.data,
        });
        return NextResponse.json(service);
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }
        console.error("PUT /api/services/[id] error:", error);
        return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.service.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }
        console.error("DELETE /api/services/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
    }
}
