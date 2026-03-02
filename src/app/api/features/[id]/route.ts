import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        // Remove the id from the body, as it can't be updated
        const { id: _, createdAt: __, updatedAt: ___, ...updateData } = body;

        const feature = await prisma.feature.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(feature);
    } catch (error) {
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
    } catch (error) {
        console.error("DELETE /api/features/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete feature" }, { status: 500 });
    }
}
