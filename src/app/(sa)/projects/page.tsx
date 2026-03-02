import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your network design projects"
      >
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first network design project to get started.
          </p>
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                ...project,
                updatedAt: project.updatedAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
