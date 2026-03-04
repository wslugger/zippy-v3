import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateLicenseSchema } from "@/lib/zod/license";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const license = await db.license.findUnique({ where: { id } });
        if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });
        return NextResponse.json(license);
    } catch (error) {
        console.error("GET /api/licenses/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch license" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const json = await req.json();
        const payload = UpdateLicenseSchema.parse(json);
        const updated = await db.license.update({ where: { id }, data: payload });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/licenses/[id] error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.license.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/licenses/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
    }
}
