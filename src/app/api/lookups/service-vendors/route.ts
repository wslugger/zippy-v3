import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            where: { isActive: true },
            select: { serviceOptions: true },
        });

        const vendors = new Set<string>();

        for (const service of services) {
            for (const option of (service.serviceOptions as Array<Record<string, unknown>>)) {
                const vendor = option?.vendor;
                if (typeof vendor === "string" && vendor.trim()) {
                    vendors.add(vendor.trim());
                }
            }
        }

        return NextResponse.json(Array.from(vendors).sort());
    } catch (error) {
        console.error("GET /api/lookups/service-vendors error:", error);
        return NextResponse.json({ error: "Failed to fetch vendor lookup" }, { status: 500 });
    }
}
