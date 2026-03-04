import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const packages = await prisma.package.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { slug: true, name: true },
        });
        return NextResponse.json(packages);
    } catch (error) {
        console.error("GET /api/lookups/packages error:", error);
        return NextResponse.json({ error: "Failed to fetch packages lookup" }, { status: 500 });
    }
}
