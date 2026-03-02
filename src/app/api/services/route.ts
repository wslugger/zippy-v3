import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const services = await prisma.service.findMany({
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
        const service = await prisma.service.create({
            data: body,
        });
        return NextResponse.json(service);
    } catch (error) {
        console.error("POST /api/services error:", error);
        return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
    }
}
