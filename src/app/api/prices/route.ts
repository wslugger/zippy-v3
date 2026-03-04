import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreatePriceSchema, BulkCreatePricesSchema } from "@/lib/zod/price";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
    try {
        const prices = await db.price.findMany({ orderBy: { sku: "asc" } });
        return NextResponse.json(prices);
    } catch (error) {
        console.error("GET /api/prices error:", error);
        return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();

        if (Array.isArray(json)) {
            const payload = BulkCreatePricesSchema.parse(json);
            const prepared = payload.map((p) => ({ ...p, effectiveDate: new Date(p.effectiveDate) }));
            const result = await db.price.createMany({ data: prepared, skipDuplicates: true });
            return NextResponse.json({ created: result.count }, { status: 201 });
        }

        const payload = CreatePriceSchema.parse(json);
        const created = await db.price.create({
            data: { ...payload, effectiveDate: new Date(payload.effectiveDate) },
        });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error("POST /api/prices error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Failed to create price(s)" }, { status: 500 });
    }
}
