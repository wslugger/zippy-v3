import { FileText, Network, BookOpen, Video, ExternalLink } from "lucide-react";
import type { Collateral } from "@/lib/types";

const typeIcons: Record<string, React.ElementType> = {
  PDF: FileText,
  Diagram: Network,
  Reference: BookOpen,
  Video: Video,
};

interface CollateralListProps {
  items: Collateral[];
}

export function CollateralList({ items }: CollateralListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Collateral</h3>
      <ul className="space-y-1">
        {items.map((item, idx) => {
          const Icon = typeIcons[item.type] ?? FileText;
          return (
            <li key={idx}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
