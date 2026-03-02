import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import Link from "next/link";

export default async function ProjectsDashboard() {
    const projects = await prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Project Ledger"
                description="View and manage your current design projects. Each project tracks progress across ingestion, discovery, architecture, and BOM stages."
                actions={
                    <Link href="/projects/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm border-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                    </Link>
                }
            />

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                        <FolderOpen className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-zinc-900">No projects found</h3>
                        <p className="text-zinc-500 max-w-sm">
                            Get started by creating your first project. You'll then be able to select a service package and define site requirements.
                        </p>
                    </div>
                    <Link href="/projects/new">
                        <Button variant="outline" className="mt-4 border-zinc-200">
                            Create First Project
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
