"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CollateralList } from "./collateral-list";
import { Check } from "lucide-react";
import type { PackageServiceInclusion, Collateral, InclusionDesignation } from "@/lib/types";
import { INCLUSION_DESIGNATION_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PackageDetailProps {
  pkg: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
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

export function PackageDetail({ pkg, projectId, isSelected }: PackageDetailProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);

  const services = pkg.includedServices as PackageServiceInclusion[];
  const collateral = pkg.collateral as Collateral[];

  async function handleSelect() {
    setSelecting(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
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
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch {
      setSelecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{pkg.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.shortDescription}</p>
            </div>
            {isSelected ? (
              <Badge className="bg-green-100 text-green-700">
                <Check className="mr-1 h-3 w-3" />
                Selected
              </Badge>
            ) : (
              <Button onClick={handleSelect} disabled={selecting}>
                {selecting ? "Selecting..." : "Select This Package"}
              </Button>
            )}
          </div>
        </CardHeader>
        {pkg.description && (
          <CardContent>
            <p className="text-sm leading-relaxed">{pkg.description}</p>
          </CardContent>
        )}
      </Card>

      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Included Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((svc) => (
                <div key={svc.serviceId} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{svc.serviceName}</span>
                    {svc.includedOptionIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {svc.includedOptionIds.length} option
                        {svc.includedOptionIds.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", DESIGNATION_BADGE_STYLES[svc.designation])}
                  >
                    {INCLUSION_DESIGNATION_LABELS[svc.designation]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {collateral.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package Collateral</CardTitle>
          </CardHeader>
          <CardContent>
            <CollateralList items={collateral} />
          </CardContent>
        </Card>
      )}

      {!isSelected && (
        <>
          <Separator />
          <div className="flex justify-end">
            <Button onClick={handleSelect} disabled={selecting} size="lg">
              {selecting ? "Selecting..." : "Select This Package"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
