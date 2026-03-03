import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateServiceSchema = z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    shortDescription: z.string(),
    description: z.string(),
    constraints: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
    serviceOptions: z.array(z.any()).default([]),
    isActive: z.boolean().default(true),
});

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(services);
    } catch (error) {
        console.error("GET /api/services error:", error);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreateServiceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
        }
        const service = await prisma.service.create({
            data: parsed.data,
        });
        return NextResponse.json(service, { status: 201 });
    } catch (error) {
        console.error("POST /api/services error:", error);
        return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
    }
}
