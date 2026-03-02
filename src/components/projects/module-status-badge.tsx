import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MODULE_STATE_COLORS } from "@/lib/constants";

interface ModuleStatusBadgeProps {
    state: string;
    className?: string;
}

export function ModuleStatusBadge({ state, className }: ModuleStatusBadgeProps) {
    const colorClass = MODULE_STATE_COLORS[state as keyof typeof MODULE_STATE_COLORS] || MODULE_STATE_COLORS.not_started;

    const label = state
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <Badge variant="secondary" className={cn("px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", colorClass, className)}>
            {label}
        </Badge>
    );
}
