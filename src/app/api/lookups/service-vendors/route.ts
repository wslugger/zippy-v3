import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
    try {
        const services = await db.service.findMany({
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
        // Return empty array so client .map() never throws
        return NextResponse.json([]);
    }
}
