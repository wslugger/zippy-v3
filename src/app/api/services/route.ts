import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
    try {
        const services = await db.service.findMany({
            where: { isActive: true }, // Filter for license lookups if needed, but here it's main catalog
            orderBy: { name: "asc" },
        });
        return NextResponse.json(services);
    } catch (error) {
        console.error("GET /api/services error:", error);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const service = await db.service.create({
            data: body,
        });
        return NextResponse.json(service);
    } catch (error) {
        console.error("POST /api/services error details:", error);
        return NextResponse.json({
            error: "Failed to create service",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
