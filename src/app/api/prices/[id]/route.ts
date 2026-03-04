import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdatePriceSchema } from "@/lib/zod/price";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const price = await db.price.findUnique({ where: { id } });
        if (!price) return NextResponse.json({ error: "Price not found" }, { status: 404 });
        return NextResponse.json(price);
    } catch (error) {
        console.error("GET /api/prices/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const json = await req.json();
        const payload = UpdatePriceSchema.parse(json);
        const data: Record<string, unknown> = { ...payload };
        if (payload.effectiveDate) data.effectiveDate = new Date(payload.effectiveDate);
        const updated = await db.price.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/prices/[id] error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Failed to update price" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.price.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/prices/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete price" }, { status: 500 });
    }
}
