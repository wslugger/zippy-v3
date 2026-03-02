import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_STATE_COLORS } from "@/lib/constants";

interface ProjectCardProps {
    project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const moduleStates = project.moduleStates || {};

    return (
        <Link href={`/projects/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group border-zinc-200">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors truncate">
                            {project.customerName}
                        </h3>
                        <Badge variant="outline" className="font-medium bg-zinc-50">
                            {project.packageName || "No Package"}
                        </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-2 min-h-[2.5rem]">
                        {project.description || "No description provided."}
                    </p>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Solution Architect</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                    <div className="flex gap-1">
                        {["ingestion", "discovery", "architecture", "bom"].map((mod) => {
                            const state = moduleStates[mod] || "not_started";
                            const colorClass = MODULE_STATE_COLORS[state as keyof typeof MODULE_STATE_COLORS];
                            return (
                                <div
                                    key={mod}
                                    className={cn("w-2 h-2 rounded-full", colorClass.split(" ")[0])}
                                    title={`${mod}: ${state}`}
                                />
                            );
                        })}
                    </div>
                    <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
                        View <ArrowRight className="w-4 h-4" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
