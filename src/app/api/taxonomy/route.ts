import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const taxonomy = await prisma.globalTaxonomy.findUnique({
            where: { type: "global" },
        });
        return NextResponse.json(taxonomy?.data || {});
    } catch (error) {
        console.error("Error fetching taxonomy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();

        const taxonomy = await prisma.globalTaxonomy.upsert({
            where: { type: "global" },
            update: {
                data: body,
            },
            create: {
                type: "global",
                data: body,
            },
        });

        return NextResponse.json(taxonomy.data);
    } catch (error) {
        console.error("Error updating taxonomy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
