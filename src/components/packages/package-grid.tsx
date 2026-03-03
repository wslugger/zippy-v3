import { PackageCard } from "./package-card";

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
  selectedPackageId: string | null;
  servicesCatalog?: any[];
}

export function PackageGrid({
  packages,
  projectId,
  selectedPackageId,
  servicesCatalog = [],
}: PackageGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          projectId={projectId}
          isSelected={pkg.id === selectedPackageId}
          servicesCatalog={servicesCatalog}
        />
      ))}
    </div>
  );
}
