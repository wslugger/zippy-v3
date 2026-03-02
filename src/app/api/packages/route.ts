import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const packages = await prisma.package.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(packages);
    } catch (error) {
        console.error("Error fetching packages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
