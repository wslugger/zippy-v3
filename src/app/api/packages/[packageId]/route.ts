import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ packageId: string }> }
) {
    try {
        const { packageId } = await params;
        const pkg = await prisma.package.findFirst({
            where: {
                OR: [
                    { id: packageId },
                    { slug: packageId }
                ],
                isActive: true
            },
        });

        if (!pkg) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        return NextResponse.json(pkg);
    } catch (error) {
        console.error("Error fetching package:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
