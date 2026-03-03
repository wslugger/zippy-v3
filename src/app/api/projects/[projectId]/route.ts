import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateProjectSchema } from "@/lib/types";
import type { ModuleStates } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const parsed = UpdateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { ...parsed.data };

    // Merge moduleStates (partial update)
    if (parsed.data.moduleStates) {
      const currentStates = existing.moduleStates as ModuleStates;
      updateData.moduleStates = {
        ...currentStates,
        ...parsed.data.moduleStates,
      };
    }

    // If package selection changed, trigger downstream invalidation
    if (
      parsed.data.selectedPackageId &&
      parsed.data.selectedPackageId !== existing.selectedPackageId
    ) {
      const states = (updateData.moduleStates ??
        existing.moduleStates) as ModuleStates;
      updateData.moduleStates = {
        ...states,
        ingestion: "completed",
        configuration:
          states.configuration === "completed"
            ? "out_of_date"
            : states.configuration,
        bomGeneration:
          states.bomGeneration === "completed"
            ? "out_of_date"
            : states.bomGeneration,
        hldGeneration:
          states.hldGeneration === "completed"
            ? "out_of_date"
            : states.hldGeneration,
      };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("[PROJECT_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
