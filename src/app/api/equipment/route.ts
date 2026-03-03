import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateEquipmentSchema } from "@/lib/zod/equipment";
import { z } from "zod";

export async function GET() {
    try {
        const items = await (prisma as any).equipment.findMany({
            orderBy: [{ make: "asc" }, { model: "asc" }],
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("GET /api/equipment error:", error);
        return NextResponse.json(
            { error: "Failed to fetch equipment" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const payload = CreateEquipmentSchema.parse(json);

        const dataToCreate: any = { ...payload };
        if (payload.eosDate) {
            dataToCreate.eosDate = new Date(payload.eosDate);
        }

        const created = await (prisma as any).equipment.create({
            data: dataToCreate,
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error("POST /api/equipment error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: (error as any).issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create equipment" },
            { status: 500 }
        );
    }
}
