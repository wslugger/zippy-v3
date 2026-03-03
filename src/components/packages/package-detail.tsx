"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CollateralList } from "./collateral-list";
import { Check, ChevronDown, ChevronRight, Info } from "lucide-react";
import type { PackageServiceInclusion, Collateral, InclusionDesignation } from "@/lib/types";
import { INCLUSION_DESIGNATION_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DesignOptionGroup {
  groupId: string;
  groupLabel: string;
  choices: { value: string; id?: string; label: string; shortDescription?: string }[];
}

interface ServiceOptionDef {
  optionId: string;
  name: string;
  shortDescription?: string;
  designOptions?: DesignOptionGroup[];
}

interface ServiceCatalogEntry {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  serviceOptions: ServiceOptionDef[];
  features: string[];
}

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
  servicesCatalog?: ServiceCatalogEntry[];
}

const DESIGNATION_BADGE_STYLES: Record<InclusionDesignation, string> = {
  required: "bg-primary text-primary-foreground",
  standard: "bg-blue-600/10 text-blue-700 border-blue-200",
  optional: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function PackageDetail({ pkg, projectId, isSelected, servicesCatalog = [] }: PackageDetailProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  const services = pkg.includedServices as PackageServiceInclusion[];
  const collateral = pkg.collateral as Collateral[];

  const toggleService = (serviceId: string) => {
    setExpandedServices(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

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
      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-zinc-200">
        <CardHeader className="bg-zinc-50/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.shortDescription}</p>
            </div>
            {isSelected ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
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
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-zinc-600">{pkg.description}</p>
          </CardContent>
        )}
      </Card>

      {services.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Included Services</h3>
          </div>

          <div className="grid gap-4">
            {services.map((svc) => {
              const catalogEntry = servicesCatalog.find(s => s.id === svc.serviceId || s.slug === svc.serviceSlug);
              const isExpanded = expandedServices[svc.serviceId];

              const requiredFeatures = svc.includedFeatures?.filter(f => f.designation === "required") || [];
              const standardFeatures = svc.includedFeatures?.filter(f => f.designation === "standard") || [];
              const optionalFeatures = svc.includedFeatures?.filter(f => f.designation === "optional") || [];

              return (
                <Card key={svc.serviceId} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                    onClick={() => toggleService(svc.serviceId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-100">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                      </div>
                      <div>
                        <span className="text-base font-semibold block">{svc.serviceName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] uppercase font-bold px-1.5 py-0", DESIGNATION_BADGE_STYLES[svc.designation])}
                          >
                            {INCLUSION_DESIGNATION_LABELS[svc.designation]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {svc.includedOptions?.length || 0} Options • {svc.includedFeatures?.length || 0} Features
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="border-t bg-zinc-50/30 pt-4 space-y-6">
                      {/* Service Options */}
                      {svc.includedOptions?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Options</h4>
                          <div className="grid gap-2">
                            {svc.includedOptions.map(opt => {
                              const optDef = catalogEntry?.serviceOptions?.find(o => o.optionId === opt.optionId);
                              return (
                                <div key={opt.optionId} className="flex items-start justify-between p-3 rounded-lg bg-white border shadow-sm">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{optDef?.name || opt.optionId}</span>
                                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0", DESIGNATION_BADGE_STYLES[opt.designation])}>
                                        {opt.designation}
                                      </Badge>
                                    </div>
                                    {optDef?.shortDescription && (
                                      <p className="text-xs text-muted-foreground max-w-lg">{optDef.shortDescription}</p>
                                    )}

                                    {/* Design Choices under this option */}
                                    {svc.includedDesignChoices?.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {svc.includedDesignChoices.map(choice => {
                                          // Find the choice definition
                                          const group = optDef?.designOptions?.find(g => g.groupId === choice.groupId);
                                          const choiceDef = group?.choices?.find((c) => c.value === choice.choiceValue || c.id === choice.choiceValue);

                                          if (!group) return null;

                                          return (
                                            <div key={`${choice.groupId}-${choice.choiceValue}`} className="flex flex-col gap-1">
                                              <div className="flex items-center gap-1.5 bg-zinc-100/80 px-2 py-1 rounded border border-zinc-200">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase">{group.groupLabel}:</span>
                                                <span className="text-[10px] font-medium text-zinc-700">{choiceDef?.label || choice.choiceValue}</span>
                                                <Badge variant="outline" className={cn("text-[8px] px-1 py-0", DESIGNATION_BADGE_STYLES[choice.designation])}>
                                                  {choice.designation}
                                                </Badge>
                                              </div>
                                              {choiceDef?.shortDescription && (
                                                <div className="flex items-start gap-1 px-1">
                                                  <Info className="h-2.5 w-2.5 text-zinc-400 mt-0.5 shrink-0" />
                                                  <span className="text-[9px] text-zinc-500 italic leading-tight">{choiceDef.shortDescription}</span>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Categorized Features */}
                      {svc.includedFeatures?.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Features</h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Required Features */}
                            {requiredFeatures.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                                  <div className="h-1 w-1 rounded-full bg-primary" />
                                  REQUIRED
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {requiredFeatures.map(f => (
                                    <Badge key={f.featureSlug} variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 text-[11px]">
                                      {f.featureSlug}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Standard Features */}
                            {standardFeatures.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-blue-600 flex items-center gap-1.5">
                                  <div className="h-1 w-1 rounded-full bg-blue-600" />
                                  STANDARD (OPT-OUT)
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {standardFeatures.map(f => (
                                    <Badge key={f.featureSlug} variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 text-[11px]">
                                      {f.featureSlug}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Optional Features */}
                            {optionalFeatures.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5">
                                  <div className="h-1 w-1 rounded-full bg-zinc-400" />
                                  OPTIONAL (OPT-IN)
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {optionalFeatures.map(f => (
                                    <Badge key={f.featureSlug} variant="outline" className="text-zinc-500 border-zinc-200 text-[11px]">
                                      {f.featureSlug}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
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
