import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateProjectSchema } from "@/lib/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await request.json();
        const result = UpdateProjectSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.format() }, { status: 400 });
        }

        const currentProject = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!currentProject) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const updateData: any = { ...result.data };
        const currentModuleStates: any = currentProject.moduleStates || {};
        let newModuleStates = { ...currentModuleStates, ...(result.data.moduleStates || {}) };

        // If a package is being selected/changed
        if (result.data.selectedPackageId && result.data.selectedPackageId !== currentProject.selectedPackageId) {
            newModuleStates.ingestion = "completed";

            // If it's a change (not first selection), invalidate downstream
            if (currentProject.selectedPackageId) {
                newModuleStates.discovery = "out_of_date";
                newModuleStates.architecture = "out_of_date";
                newModuleStates.bom = "out_of_date";
            }
        }

        updateData.moduleStates = newModuleStates;

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
