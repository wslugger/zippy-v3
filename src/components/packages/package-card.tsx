import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PackageServiceInclusion, Collateral, InclusionDesignation } from "@/lib/types";
import { INCLUSION_DESIGNATION_LABELS } from "@/lib/types";

interface PackageCardProps {
  pkg: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    includedServices: unknown[];
    collateral: unknown[];
  };
  projectId: string;
  isSelected: boolean;
}

const DESIGNATION_BADGE_STYLES: Record<InclusionDesignation, string> = {
  required: "bg-primary text-primary-foreground",
  standard: "bg-secondary text-secondary-foreground",
  optional: "border border-dashed text-muted-foreground bg-transparent",
};

export function PackageCard({ pkg, projectId, isSelected }: PackageCardProps) {
  const services = pkg.includedServices as PackageServiceInclusion[];
  const collateral = pkg.collateral as Collateral[];

  return (
    <Link href={`/projects/${projectId}/packages/${pkg.slug}`}>
      <Card
        className={cn(
          "h-full transition-colors hover:bg-accent/50",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{pkg.name}</CardTitle>
            {isSelected && (
              <Badge className="bg-green-100 text-green-700">Selected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{pkg.shortDescription}</p>
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 3).map((svc) => (
              <Badge
                key={svc.serviceId}
                variant="secondary"
                className={cn("text-xs", DESIGNATION_BADGE_STYLES[svc.designation])}
              >
                {INCLUSION_DESIGNATION_LABELS[svc.designation]}
              </Badge>
            ))}
            {services.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{services.length - 3} more
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {services.length} services &middot; {collateral.length} documents
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
