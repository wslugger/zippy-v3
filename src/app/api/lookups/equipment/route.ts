import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
    try {
        const items = await db.equipment.findMany({
            orderBy: { sku: "asc" },
            select: { sku: true, model: true },
        });
        return NextResponse.json(
            items.map((e: { sku: string; model: string }) => ({ sku: e.sku, name: e.model }))
        );
    } catch (error) {
        console.error("GET /api/lookups/equipment error:", error);
        return NextResponse.json({ error: "Failed to fetch equipment lookup" }, { status: 500 });
    }
}
