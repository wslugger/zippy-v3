import { MODULE_STATE_COLORS } from "@/lib/constants";
import type { ModuleState } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModuleStatusBadgeProps {
  state: ModuleState;
}

export function ModuleStatusBadge({ state }: ModuleStatusBadgeProps) {
  const colors = MODULE_STATE_COLORS[state];
  return (
    <Badge variant="secondary" className={cn(colors.bg, colors.text)}>
      {colors.label}
    </Badge>
  );
}
