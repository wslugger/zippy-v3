import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateEquipmentSchema } from "@/lib/zod/equipment";
import { z } from "zod";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const p = await params;
        const item = await (prisma as any).equipment.findUnique({
            where: { id: p.id },
        });
        if (!item) {
            return NextResponse.json(
                { error: "Equipment not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(item);
    } catch (error) {
        console.error("GET /api/equipment/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to fetch equipment" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const p = await params;
        const json = await req.json();
        const payload = UpdateEquipmentSchema.parse(json);

        const dataToUpdate: Record<string, unknown> = { ...payload };
        if (payload.eosDate !== undefined) {
            dataToUpdate.eosDate = payload.eosDate ? new Date(payload.eosDate) : null;
        }

        const updated = await (prisma as any).equipment.update({
            where: { id: p.id },
            data: dataToUpdate,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/equipment/[id] error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: (error as any).issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update equipment" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const p = await params;
        await (prisma as any).equipment.delete({
            where: { id: p.id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("DELETE /api/equipment/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to delete equipment" },
            { status: 500 }
        );
    }
}
