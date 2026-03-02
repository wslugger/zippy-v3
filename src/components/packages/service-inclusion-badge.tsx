import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ServiceInclusionBadgeProps {
    type: "required" | "standard" | "optional";
    className?: string;
}

export function ServiceInclusionBadge({ type, className }: ServiceInclusionBadgeProps) {
    const variants = {
        required: "bg-red-50 text-red-600 border-red-100",
        standard: "bg-blue-50 text-blue-600 border-blue-100",
        optional: "bg-zinc-50 text-zinc-600 border-zinc-100",
    };

    return (
        <Badge
            variant="outline"
            className={cn("px-2 py-0.5 text-[10px] uppercase font-bold tracking-tight rounded-md", variants[type], className)}
        >
            {type}
        </Badge>
    );
}
