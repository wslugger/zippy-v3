import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODULE_STATE_COLORS } from "@/lib/constants";
import type { ModuleStates } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    customerName: string;
    description: string | null;
    status: string;
    moduleStates: unknown;
    packageName: string | null;
    updatedAt: string | Date;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const states = project.moduleStates as ModuleStates;
  const stateEntries = Object.entries(states) as [
    keyof ModuleStates,
    string,
  ][];

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{project.customerName}</CardTitle>
            <Badge variant="outline" className="text-xs capitalize">
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          {project.packageName && (
            <p className="text-xs text-muted-foreground">
              Package: <span className="font-medium text-foreground">{project.packageName}</span>
            </p>
          )}
          <div className="flex gap-1.5">
            {stateEntries.map(([key, state]) => {
              const colors =
                MODULE_STATE_COLORS[
                  state as keyof typeof MODULE_STATE_COLORS
                ];
              return (
                <span
                  key={key}
                  className={cn("h-2 w-2 rounded-full", colors.bg)}
                  title={`${key}: ${colors.label}`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Updated{" "}
            {new Date(project.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
