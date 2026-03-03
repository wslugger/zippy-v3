"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PackageServiceInclusion, Collateral, InclusionDesignation } from "@/lib/types";
import { INCLUSION_DESIGNATION_LABELS } from "@/lib/types";
import { Loader2 } from "lucide-react";

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
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);
  const services = pkg.includedServices as PackageServiceInclusion[];
  const collateral = pkg.collateral as Collateral[];

  async function handleSelect() {
    if (isSelected || isSelecting) return;

    setIsSelecting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPackageId: pkg.id,
          packageSlug: pkg.slug,
          packageName: pkg.name,
          packageCollateral: collateral,
          moduleStates: { ingestion: "completed" },
        }),
      });

      if (res.ok) {
        router.push(`/projects/${projectId}`);
        router.refresh();
      } else {
        setIsSelecting(false);
      }
    } catch (error) {
      console.error("Failed to select package:", error);
      setIsSelecting(false);
    }
  }

  return (
    <div
      role="button"
      onClick={handleSelect}
      className={cn(
        "cursor-pointer group relative",
        (isSelected || isSelecting) && "pointer-events-none"
      )}
    >
      <Card
        className={cn(
          "h-full transition-all duration-200",
          "hover:border-primary/50 hover:shadow-md hover:bg-accent/5",
          isSelected && "ring-2 ring-primary border-primary",
          isSelecting && "opacity-70 grayscale-[0.5]"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              {pkg.name}
              {isSelecting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </CardTitle>
            {isSelected && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Selected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{pkg.shortDescription}</p>

          <div className="space-y-3 pt-2">
            {services.map((svc) => (
              <div key={svc.serviceId} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 line-clamp-1">{svc.serviceName}</span>
                  <Badge
                    variant="secondary"
                    className={cn("text-[9px] uppercase px-1.5 py-0 h-4 border-transparent shadow-none shrink-0", DESIGNATION_BADGE_STYLES[svc.designation])}
                  >
                    {INCLUSION_DESIGNATION_LABELS[svc.designation]}
                  </Badge>
                </div>

                {/* Options List */}
                {svc.includedOptions && svc.includedOptions.length > 0 && (
                  <ul className="pl-4 space-y-1 border-l-2 border-zinc-100/80">
                    {svc.includedOptions.map((opt) => {
                      const catalogEntry = servicesCatalog?.find((s: any) => s.id === svc.serviceId || s.slug === svc.serviceSlug);
                      const optDef = catalogEntry?.serviceOptions?.find((o: any) => o.optionId === opt.optionId);
                      const optionName = optDef?.name || opt.optionId;

                      return (
                        <li key={opt.optionId} className="text-xs text-zinc-600 flex items-center justify-between group/opt">
                          <span className="line-clamp-1 flex-1 pr-2">{optionName}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {services.length} services &middot; {collateral.length} documents
            </p>
            {!isSelected && !isSelecting && (
              <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                Select Package &rarr;
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

