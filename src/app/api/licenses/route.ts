import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateLicenseSchema } from "@/lib/zod/license";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
    try {
        const licenses = await db.license.findMany({
            orderBy: [{ vendor: "asc" }, { name: "asc" }],
        });
        return NextResponse.json(licenses);
    } catch (error) {
        console.error("GET /api/licenses error:", error);
        return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const payload = CreateLicenseSchema.parse(json);

        // Validate supportedHardware SKUs exist
        if (payload.supportedHardware.length > 0) {
            const found = await db.equipment.findMany({
                where: { sku: { in: payload.supportedHardware } },
                select: { sku: true },
            });
            const foundSkus = found.map((e: { sku: string }) => e.sku);
            const invalid = payload.supportedHardware.filter((s) => !foundSkus.includes(s));
            if (invalid.length > 0) {
                return NextResponse.json(
                    { error: `Unknown equipment SKUs: ${invalid.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        // Validate supportedPackages slugs exist
        if (payload.supportedPackages.length > 0) {
            const found = await db.package.findMany({
                where: { slug: { in: payload.supportedPackages } },
                select: { slug: true },
            });
            const foundSlugs = found.map((p: { slug: string }) => p.slug);
            const invalid = payload.supportedPackages.filter((s) => !foundSlugs.includes(s));
            if (invalid.length > 0) {
                return NextResponse.json(
                    { error: `Unknown package slugs: ${invalid.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        const created = await db.license.create({ data: payload });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error("POST /api/licenses error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Failed to create license" }, { status: 500 });
    }
}
