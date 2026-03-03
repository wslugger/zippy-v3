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
  servicesCatalog?: any[];
}

const DESIGNATION_BADGE_STYLES: Record<InclusionDesignation, string> = {
  required: "bg-primary text-primary-foreground",
  standard: "bg-secondary text-secondary-foreground",
  optional: "border border-dashed text-muted-foreground bg-transparent",
};

export function PackageCard({ pkg, projectId, isSelected, servicesCatalog = [] }: PackageCardProps) {
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
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{pkg.shortDescription}</p>

          <div className="space-y-3 pt-2">
            {services.map((svc) => (
              <div key={svc.serviceId} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">{svc.serviceName}</span>
                  <Badge
                    variant="secondary"
                    className={cn("text-[9px] uppercase px-1.5 py-0 h-4 border-transparent shadow-none", DESIGNATION_BADGE_STYLES[svc.designation])}
                  >
                    {INCLUSION_DESIGNATION_LABELS[svc.designation]}
                  </Badge>
                </div>

                {/* Options List */}
                {svc.includedOptions && svc.includedOptions.length > 0 && (
                  <ul className="pl-4 space-y-1 border-l-2 border-zinc-100/80">
                    {svc.includedOptions.map((opt) => {
                      // Find the option name from the catalog if passed, else fallback
                      const catalogEntry = servicesCatalog?.find((s: any) => s.id === svc.serviceId || s.slug === svc.serviceSlug);
                      const optDef = catalogEntry?.serviceOptions?.find((o: any) => o.optionId === opt.optionId);
                      const optionName = optDef?.name || opt.optionId;

                      return (
                        <li key={opt.optionId} className="text-xs text-zinc-600 flex items-center justify-between group">
                          <span className="line-clamp-1 flex-1 pr-2">{optionName}</span>
                          <span className="text-[9px] text-zinc-400 capitalize bg-zinc-50 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {opt.designation}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Fallback if no options but we want to show there are features */}
                {(!svc.includedOptions || svc.includedOptions.length === 0) && (svc.includedFeatures?.length > 0) && (
                  <p className="text-[10px] text-zinc-500 pl-4">{svc.includedFeatures.length} included features</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground pt-2 border-t mt-4">
            {services.length} services &middot; {collateral.length} documents
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
