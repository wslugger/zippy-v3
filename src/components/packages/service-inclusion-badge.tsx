import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InclusionDesignation } from "@/lib/types";
import { INCLUSION_DESIGNATION_LABELS } from "@/lib/types";

interface ServiceInclusionBadgeProps {
  /** The inclusion designation for the service in a package */
  designation: InclusionDesignation;
}

const styles: Record<InclusionDesignation, string> = {
  required: "bg-primary text-primary-foreground",
  standard: "bg-secondary text-secondary-foreground",
  optional: "border border-dashed text-muted-foreground bg-transparent",
};

export function ServiceInclusionBadge({ designation }: ServiceInclusionBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("text-xs", styles[designation])}>
      {INCLUSION_DESIGNATION_LABELS[designation]}
    </Badge>
  );
}
