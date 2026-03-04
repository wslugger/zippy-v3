import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const service = await db.service.findUnique({
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

        // Remove the id from the body, as it can't be updated
        const { id: _, createdAt: __, updatedAt: ___, ...updateData } = body;

        const service = await db.service.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(service);
    } catch (error) {
        console.error("PUT /api/services/[id] error details:", error);
        return NextResponse.json({
            error: "Failed to update service",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.service.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/services/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
    }
}
