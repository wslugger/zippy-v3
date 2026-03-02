"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MODULE_LABELS, MODULE_STATE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ModuleBreadcrumbs() {
    const pathname = usePathname();
    const [projectData, setProjectData] = useState<{ id: string, states: any } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const match = pathname.match(/\/projects\/([^\/]+)/);
        const id = match && match[1] !== "new" ? match[1] : null;

        if (id) {
            if (projectData?.id !== id) {
                setLoading(true);
                fetchProject(id).then(data => {
                    setProjectData({ id, states: data.moduleStates });
                    setLoading(false);
                });
            }
        } else {
            setProjectData(null);
        }
    }, [pathname]);

    const fetchProject = async (id: string) => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            return await res.json();
        } catch (error) {
            console.error("Error fetching project for breadcrumbs:", error);
            return { moduleStates: null };
        }
    };

    if (!projectData || !projectData.states) return null;
    const { states: moduleStates } = projectData;

    return (
        <div className="flex items-center gap-2 px-6 py-3 border-b bg-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2">Workflow:</span>
            <div className="flex items-center gap-1">
                {Object.entries(MODULE_LABELS).map(([key, label], index) => {
                    const state = moduleStates[key] || "not_started";
                    const colorClass = MODULE_STATE_COLORS[state as keyof typeof MODULE_STATE_COLORS];

                    return (
                        <div key={key} className="flex items-center">
                            <Badge variant="secondary" className={cn("px-3 py-1 font-medium rounded-full text-[10px]", colorClass)}>
                                {label}
                            </Badge>
                            {index < Object.entries(MODULE_LABELS).length - 1 && (
                                <div className="w-4 h-[1px] bg-zinc-200 mx-1" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
