"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MODULE_LABELS, MODULE_STATE_COLORS } from "@/lib/constants";
import type { ModuleStates } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ModuleBreadcrumbs() {
  const pathname = usePathname();
  const [moduleStates, setModuleStates] = useState<ModuleStates | null>(null);
  const [mounted, setMounted] = useState(false);

  // Extract projectId from URL if present
  const projectIdMatch = pathname.match(/\/projects\/([a-f0-9]{24})/);
  const projectId = projectIdMatch?.[1];

  useEffect(() => {
    setMounted(true);
    if (!projectId) {
      setModuleStates(null);
      return;
    }

    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.moduleStates) {
          setModuleStates(data.moduleStates);
        }
      })
      .catch(() => setModuleStates(null));
  }, [projectId]);

  if (!projectId || !mounted) return null;

  return (
    <div className="flex h-10 items-center gap-2 border-b bg-card px-4">
      {(
        Object.entries(MODULE_LABELS) as [keyof typeof MODULE_LABELS, string][]
      ).map(([key, label]) => {
        const state = moduleStates?.[key as keyof ModuleStates] ?? "not_started";
        const colors = MODULE_STATE_COLORS[state];
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              colors.bg,
              colors.text
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                state === "not_started" ? "bg-zinc-400" :
                  state === "in_progress" ? "bg-blue-500" :
                    state === "completed" ? "bg-green-500" :
                      state === "out_of_date" ? "bg-amber-500" :
                        "bg-red-500"
              )}
            />
            {label}
          </span>
        );
      })}
    </div>
  );
}
