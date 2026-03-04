import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
    try {
        const packages = await db.package.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { slug: true, name: true },
        });
        return NextResponse.json(packages);
    } catch (error) {
        console.error("GET /api/lookups/packages error:", error);
        // Return empty array so client .map() never throws
        return NextResponse.json([]);
    }
}
