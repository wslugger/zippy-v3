import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateProjectSchema, DEFAULT_MODULE_STATES } from "@/lib/types";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      customerName: parsed.data.customerName,
      description: parsed.data.description,
      status: "draft",
      moduleStates: DEFAULT_MODULE_STATES,
      packageCollateral: [],
      bomSnapshot: [],
      sites: [],
    },
  });

  return NextResponse.json(project, { status: 201 });
}
