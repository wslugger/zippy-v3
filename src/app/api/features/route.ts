import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const features = await prisma.feature.findMany({
            orderBy: [{ service: "asc" }, { name: "asc" }],
        });
        return NextResponse.json(features);
    } catch (error) {
        console.error("GET /api/features error:", error);
        return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const feature = await prisma.feature.create({
            data: body,
        });
        return NextResponse.json(feature);
    } catch (error) {
        console.error("POST /api/features error:", error);
        return NextResponse.json({ error: "Failed to create feature" }, { status: 500 });
    }
}
