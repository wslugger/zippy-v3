"use client";

import { useState } from "react";
import { PackageCard } from "./package-card";
import { AiPackageAssistant } from "./ai-package-assistant";
import type { AIRecommendation } from "@/lib/types";

interface PackageGridProps {
  packages: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    includedServices: unknown[];
    collateral: unknown[];
  }[];
  projectId: string;
  selectedPackageId: string | null | undefined;
  servicesCatalog?: any[];
}

export function PackageGrid({
  packages,
  projectId,
  selectedPackageId,
  servicesCatalog = [],
}: PackageGridProps) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);

  return (
    <div className="space-y-6">
      <AiPackageAssistant
        projectId={projectId}
        onRecommendation={setRecommendation}
        recommendedPackageId={recommendation?.packageId}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            projectId={projectId}
            isSelected={pkg.id === selectedPackageId}
            isRecommended={pkg.id === recommendation?.packageId}
            recommendationConfidence={
              pkg.id === recommendation?.packageId ? recommendation?.confidence : undefined
            }
            servicesCatalog={servicesCatalog}
          />
        ))}
      </div>
    </div>
  );
}
