"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Loader2,
    Link as LinkIcon,
    FileText,
    Video,
    Network,
    BookOpen,
    GripVertical,
} from "lucide-react";
import type {
    PackageServiceInclusion,
    Collateral,
    CollateralType,
    InclusionDesignation,
} from "@/lib/types";
import { COLLATERAL_TYPES, INCLUSION_DESIGNATION_LABELS } from "@/lib/types";

// ------- Types -------

interface ServiceOption {
    optionId: string;
    name: string;
}

interface ServiceRow {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    serviceOptions: unknown[];
    features: string[];
}

interface PackageFormProps {
    package?: {
        id: string;
        slug: string;
        name: string;
        shortDescription: string;
        description: string;
        includedServices: unknown[];
        collateral: unknown[];
        isActive: boolean;
    };
    services: ServiceRow[];
}

// ------- Helpers -------

const COLLATERAL_ICONS: Record<CollateralType, React.ElementType> = {
    PDF: FileText,
    Diagram: Network,
    Reference: BookOpen,
    Video: Video,
};

const DESIGNATION_STYLES: Record<InclusionDesignation, string> = {
    required: "bg-primary text-primary-foreground border-primary shadow-sm",
    standard: "bg-blue-600 text-white border-blue-600 shadow-sm",
    optional: "bg-white text-foreground border-border shadow-sm",
};

function DesignationToggle({
    value,
    onChange,
    className = ""
}: {
    value: InclusionDesignation;
    onChange: (d: InclusionDesignation) => void;
    className?: string;
}) {
    return (
        <div className={`flex gap-0.5 shrink-0 bg-zinc-100/50 p-0.5 rounded-md border border-zinc-200/50 hover:border-zinc-300 transition-colors shadow-inner w-fit ${className}`}>
            {(["required", "standard", "optional"] as InclusionDesignation[]).map((d) => (
                <button
                    key={d}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange(d);
                    }}
                    className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold border transition-all tracking-tight uppercase ${value === d
                        ? DESIGNATION_STYLES[d]
                        : "border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50"
                        }`}
                >
                    {d === "required" ? "Req" : d === "standard" ? "Std" : "Opt"}
                </button>
            ))}
        </div>
    );
}

const emptyCollateral = (): Collateral => ({ title: "", url: "", type: "PDF" });

function normalizeInclusions(inclusions: any[] = [], catalog: ServiceRow[] = []): PackageServiceInclusion[] {
    return inclusions.map((s) => {
        const serviceInfo = catalog.find(svc => svc.id === s.serviceId);
        const normalized = {
            ...s,
            serviceName: s.serviceName || serviceInfo?.name || "Unknown Service",
            serviceSlug: s.serviceSlug || serviceInfo?.slug || "",
            includedOptions: s.includedOptions || (s.includedOptionIds || []).map((id: string) => ({
                optionId: id,
                designation: "standard"
            })),
            includedFeatures: typeof s.includedFeatures?.[0] === 'string'
                ? (s.includedFeatures || []).map((f: string) => ({
                    featureSlug: f,
                    designation: "standard"
                }))
                : (s.includedFeatures || []),
            includedDesignChoices: s.includedDesignChoices || [],
        };

        // Migration for includedDesignOptions (record) to includedDesignChoices (array)
        if (s.includedDesignOptions && !s.includedDesignChoices) {
            const choices: any[] = [];
            Object.entries(s.includedDesignOptions).forEach(([groupId, values]) => {
                if (Array.isArray(values)) {
                    values.forEach((v: string) => {
                        choices.push({ groupId, choiceValue: v, designation: "standard" });
                    });
                }
            });
            normalized.includedDesignChoices = choices;
        }

        // Cleanup old fields
        delete normalized.includedOptionIds;
        delete normalized.includedDesignOptions;

        return normalized as PackageServiceInclusion;
    });
}

// ------- Sub-components -------

function CollateralRow({
    item,
    index,
    onChange,
    onRemove,
}: {
    item: Collateral;
    index: number;
    onChange: (index: number, field: keyof Collateral, value: string) => void;
    onRemove: (index: number) => void;
}) {
    const Icon = COLLATERAL_ICONS[item.type] ?? FileText;

    return (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <Icon className="h-4 w-4" />
                    Collateral {index + 1}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onRemove(index)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input
                        value={item.title}
                        onChange={(e) => onChange(index, "title", e.target.value)}
                        placeholder="e.g. Solution Datasheet"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <select
                        value={item.type}
                        onChange={(e) => onChange(index, "type", e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {COLLATERAL_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={item.url}
                        onChange={(e) => onChange(index, "url", e.target.value)}
                        placeholder="https://example.com/resource"
                        className="pl-8"
                        type="url"
                    />
                </div>
            </div>
        </div>
    );
}

function ServiceInclusionRow({
    inclusion,
    service,
    onDesignationChange,
    onRemove,
    onToggleOption,
    onToggleFeature,
    onToggleDesignChoice,
    onChangeDesignation,
}: {
    inclusion: PackageServiceInclusion;
    service: ServiceRow | undefined;
    onDesignationChange: (serviceId: string, d: InclusionDesignation) => void;
    onRemove: (serviceId: string) => void;
    onToggleOption: (serviceId: string, optionId: string) => void;
    onToggleFeature: (serviceId: string, feature: string) => void;
    onToggleDesignChoice: (
        serviceId: string,
        groupId: string,
        value: string,
        selectionType: "single" | "multi"
    ) => void;
    onChangeDesignation: (
        serviceId: string,
        type: "option" | "feature" | "choice",
        id: string,
        d: InclusionDesignation,
        groupId?: string
    ) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const options = (service?.serviceOptions ?? []) as ServiceOption[];
    const features = service?.features ?? [];

    return (
        <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{inclusion.serviceName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{inclusion.serviceSlug}</div>
                </div>

                {/* Designation selector */}
                <div className="flex gap-1 shrink-0 bg-zinc-100/80 p-1 rounded-md border border-zinc-200 shadow-inner">
                    {(["required", "standard", "optional"] as InclusionDesignation[]).map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => onDesignationChange(inclusion.serviceId, d)}
                            className={`px-3 py-1 rounded text-xs font-semibold border transition-all tracking-wide ${inclusion.designation === d
                                ? DESIGNATION_STYLES[d]
                                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                                }`}
                        >
                            {d === "required" ? "Required" : d === "standard" ? "Standard" : "Optional"}
                        </button>
                    ))}
                </div>

                {(options.length > 0 || features.length > 0) && (
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                )}

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
                    onClick={() => onRemove(inclusion.serviceId)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            {expanded && (
                <div className="px-4 py-3 border-t space-y-4 bg-background">
                    {options.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Section / Service Options
                            </p>
                            <div className="space-y-1">
                                {options.map((opt) => {
                                    const checked = !!inclusion.includedOptions?.find(o => o.optionId === opt.optionId);
                                    return (
                                        <div key={opt.optionId} className="space-y-1">
                                            <div className="flex items-center justify-between group h-7">
                                                <label className="flex items-center gap-2 cursor-pointer grow">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => onToggleOption(inclusion.serviceId, opt.optionId)}
                                                        className="h-4 w-4 rounded border-input accent-primary"
                                                    />
                                                    <span className="text-sm group-hover:text-foreground text-muted-foreground">
                                                        {opt.name}
                                                    </span>
                                                </label>

                                                {checked && (
                                                    <DesignationToggle
                                                        value={inclusion.includedOptions?.find(o => o.optionId === opt.optionId)?.designation || "standard"}
                                                        onChange={(d) => onChangeDesignation(inclusion.serviceId, "option", opt.optionId, d)}
                                                    />
                                                )}
                                            </div>

                                            {/* Design Options for this Service Option */}
                                            {checked && (opt as any).designOptions?.length > 0 && (
                                                <div className="ml-6 mt-2 mb-4 space-y-4 border-l-2 border-muted pl-4">
                                                    {(opt as any).designOptions.map((group: any) => (
                                                        <div key={group.groupId} className="space-y-2">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                {group.groupLabel}
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {group.choices.map((choice: any) => {
                                                                    const val = choice.value || choice.id;
                                                                    const choiceInclusion = inclusion.includedDesignChoices?.find(
                                                                        c => c.groupId === group.groupId && c.choiceValue === val
                                                                    );
                                                                    const isSelected = !!choiceInclusion;

                                                                    return (
                                                                        <div key={val} className="flex flex-col gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    onToggleDesignChoice(
                                                                                        inclusion.serviceId,
                                                                                        group.groupId,
                                                                                        val,
                                                                                        group.selectionType || "single"
                                                                                    )
                                                                                }
                                                                                className={`px-2 py-1 rounded text-xs border transition-all ${isSelected
                                                                                    ? "bg-primary/10 text-primary border-primary font-medium"
                                                                                    : "border-border text-muted-foreground hover:border-ring"
                                                                                    }`}
                                                                            >
                                                                                {choice.label || choice.name}
                                                                            </button>
                                                                            {isSelected && (
                                                                                <DesignationToggle
                                                                                    value={choiceInclusion.designation}
                                                                                    onChange={(d) => onChangeDesignation(inclusion.serviceId, "choice", val, d, group.groupId)}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {features.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Features
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {features.map((feat) => {
                                    const featInclusion = inclusion.includedFeatures?.find(f => f.featureSlug === feat);
                                    const checked = !!featInclusion;
                                    return (
                                        <div key={feat} className="flex flex-col gap-1.5 items-center bg-muted/30 p-2 rounded-lg border border-transparent hover:border-border transition-all">
                                            <button
                                                type="button"
                                                onClick={() => onToggleFeature(inclusion.serviceId, feat)}
                                                className={`px-3 py-1 rounded-full text-xs border transition-all font-medium ${checked
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-border text-muted-foreground hover:border-ring"
                                                    }`}
                                            >
                                                {feat}
                                            </button>
                                            {checked && (
                                                <DesignationToggle
                                                    value={featInclusion.designation}
                                                    onChange={(d) => onChangeDesignation(inclusion.serviceId, "feature", feat, d)}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ------- Main Form -------

export function PackageForm({ package: pkg, services }: PackageFormProps) {
    const router = useRouter();
    const isEdit = !!pkg;

    const [name, setName] = useState(pkg?.name ?? "");
    const [slug, setSlug] = useState(pkg?.slug ?? "");
    const [shortDescription, setShortDescription] = useState(pkg?.shortDescription ?? "");
    const [description, setDescription] = useState(pkg?.description ?? "");
    const [isActive, setIsActive] = useState(pkg?.isActive ?? true);
    const [inclusions, setInclusions] = useState<PackageServiceInclusion[]>(
        normalizeInclusions(pkg?.includedServices || [], services)
    );
    const [collateral, setCollateral] = useState<Collateral[]>(
        (pkg?.collateral as Collateral[]) ?? []
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate slug from name (only when creating)
    const handleNameChange = (val: string) => {
        setName(val);
        if (!isEdit) {
            setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
        }
    };

    // Collateral handlers
    const addCollateral = () => {
        if (collateral.length >= 4) return;
        setCollateral((prev) => [...prev, emptyCollateral()]);
    };

    const updateCollateral = useCallback(
        (index: number, field: keyof Collateral, value: string) => {
            setCollateral((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
        },
        []
    );

    const removeCollateral = useCallback((index: number) => {
        setCollateral((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Service inclusion handlers
    const addService = (serviceId: string) => {
        if (inclusions.find((i) => i.serviceId === serviceId)) return;
        const svc = services.find((s) => s.id === serviceId);
        if (!svc) return;
        setInclusions((prev) => [
            ...prev,
            {
                serviceId: svc.id,
                serviceName: svc.name,
                serviceSlug: svc.slug,
                designation: "standard",
                includedOptions: [],
                includedFeatures: [],
                includedDesignChoices: [],
            },
        ]);
    };

    const removeService = useCallback((serviceId: string) => {
        setInclusions((prev) => prev.filter((i) => i.serviceId !== serviceId));
    }, []);

    const changeDesignation = useCallback((serviceId: string, d: InclusionDesignation) => {
        setInclusions((prev) =>
            prev.map((i) => (i.serviceId === serviceId ? { ...i, designation: d } : i))
        );
    }, []);

    const toggleOption = useCallback((serviceId: string, optionId: string) => {
        setInclusions((prev) =>
            prev.map((i) => {
                if (i.serviceId !== serviceId) return i;
                const opts = i.includedOptions || [];
                const has = opts.find((o) => o.optionId === optionId);
                return {
                    ...i,
                    includedOptions: has
                        ? opts.filter((o) => o.optionId !== optionId)
                        : [...opts, { optionId, designation: "standard" }],
                };
            })
        );
    }, []);

    const toggleFeature = useCallback((serviceId: string, featureSlug: string) => {
        setInclusions((prev) =>
            prev.map((i) => {
                if (i.serviceId !== serviceId) return i;
                const feats = i.includedFeatures || [];
                const has = feats.find((f) => f.featureSlug === featureSlug);
                return {
                    ...i,
                    includedFeatures: has
                        ? feats.filter((f) => f.featureSlug !== featureSlug)
                        : [...feats, { featureSlug, designation: "standard" }],
                };
            })
        );
    }, []);

    const toggleDesignChoice = useCallback(
        (serviceId: string, groupId: string, value: string, selectionType: "single" | "multi") => {
            setInclusions((prev) =>
                prev.map((i) => {
                    if (i.serviceId !== serviceId) return i;

                    const currentChoices = i.includedDesignChoices || [];
                    let newChoices: typeof currentChoices;

                    const alreadyInGroup = currentChoices.filter((c) => c.groupId === groupId);
                    const isAlreadySelected = currentChoices.find((c) => c.groupId === groupId && c.choiceValue === value);

                    if (selectionType === "single") {
                        // Replace whole group with this one choice
                        newChoices = [
                            ...currentChoices.filter((c) => c.groupId !== groupId),
                            { groupId, choiceValue: value, designation: "standard" },
                        ];
                    } else {
                        // Toggle this specific choice
                        newChoices = isAlreadySelected
                            ? currentChoices.filter((c) => !(c.groupId === groupId && c.choiceValue === value))
                            : [...currentChoices, { groupId, choiceValue: value, designation: "standard" }];
                    }

                    return {
                        ...i,
                        includedDesignChoices: newChoices,
                    };
                })
            );
        },
        []
    );

    const changeItemDesignation = useCallback(
        (
            serviceId: string,
            type: "option" | "feature" | "choice",
            id: string,
            d: InclusionDesignation,
            groupId?: string
        ) => {
            setInclusions((prev) =>
                prev.map((i) => {
                    if (i.serviceId !== serviceId) return i;

                    if (type === "option") {
                        return {
                            ...i,
                            includedOptions: i.includedOptions?.map((o) =>
                                o.optionId === id ? { ...o, designation: d } : o
                            ),
                        };
                    } else if (type === "feature") {
                        return {
                            ...i,
                            includedFeatures: i.includedFeatures?.map((f) =>
                                f.featureSlug === id ? { ...f, designation: d } : f
                            ),
                        };
                    } else {
                        return {
                            ...i,
                            includedDesignChoices: i.includedDesignChoices?.map((c) =>
                                c.groupId === groupId && c.choiceValue === id
                                    ? { ...c, designation: d }
                                    : c
                            ),
                        };
                    }
                })
            );
        },
        []
    );

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                name,
                slug,
                shortDescription,
                description,
                isActive,
                includedServices: inclusions,
                collateral,
            };

            const url = isEdit ? `/api/packages/${pkg.id}` : "/api/packages";
            const method = isEdit ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "An error occurred. Please try again.");
                return;
            }

            router.push("/packages");
            router.refresh();
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableServices = services.filter(
        (s) => !inclusions.find((i) => i.serviceId === s.id)
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* ---- Basic Info ---- */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold">Basic Information</h2>
                    <p className="text-sm text-muted-foreground">
                        Name and describe the package.
                    </p>
                </div>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="pkg-name">Name</Label>
                        <Input
                            id="pkg-name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Enterprise Network"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="pkg-slug">Slug</Label>
                        <Input
                            id="pkg-slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="enterprise-network"
                            pattern="^[a-z0-9\-_]+$"
                            title="Lowercase letters, numbers, and hyphens only"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="pkg-short">Short Description</Label>
                    <Input
                        id="pkg-short"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="One-line summary shown on package cards"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="pkg-desc">Detailed Description</Label>
                    <Textarea
                        id="pkg-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Full description of the package, its purpose, and target customers..."
                        rows={5}
                    />
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <input
                        id="pkg-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="pkg-active" className="cursor-pointer">
                        Active (visible in package selection flow)
                    </Label>
                </div>
            </section>

            {/* ---- Included Services ---- */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold">Included Services</h2>
                    <p className="text-sm text-muted-foreground">
                        Select which services are part of this package and designate each as{" "}
                        <strong>Required</strong>, <strong>Standard (Opt-out)</strong>, or{" "}
                        <strong>Optional (Opt-in)</strong>. Expand a service to choose specific section
                        options and features.
                    </p>
                </div>
                <Separator />

                {inclusions.length > 0 && (
                    <div className="space-y-3">
                        {inclusions.map((inc) => {
                            const svc = services.find((s) => s.id === inc.serviceId);
                            return (
                                <ServiceInclusionRow
                                    key={inc.serviceId}
                                    inclusion={inc}
                                    service={svc}
                                    onDesignationChange={changeDesignation}
                                    onRemove={removeService}
                                    onToggleOption={toggleOption}
                                    onToggleFeature={toggleFeature}
                                    onToggleDesignChoice={toggleDesignChoice}
                                    onChangeDesignation={changeItemDesignation}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Service picker */}
                {availableServices.length > 0 && (
                    <div className="flex items-center gap-2">
                        <select
                            id="service-picker"
                            defaultValue=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    addService(e.target.value);
                                    e.target.value = "";
                                }
                            }}
                            className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="" disabled>
                                + Add a service…
                            </option>
                            {availableServices.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {inclusions.length === 0 && availableServices.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                        All available services have been added.
                    </p>
                )}

                {inclusions.length === 0 && availableServices.length > 0 && (
                    <p className="text-sm text-muted-foreground italic">
                        No services added yet. Select a service above to include it.
                    </p>
                )}

                {/* Designation legend */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {(Object.entries(INCLUSION_DESIGNATION_LABELS) as [InclusionDesignation, string][]).map(
                        ([d, label]) => (
                            <Badge
                                key={d}
                                variant="secondary"
                                className={`text-xs ${DESIGNATION_STYLES[d]}`}
                            >
                                {label}
                            </Badge>
                        )
                    )}
                </div>
            </section>

            {/* ---- Package Collateral ---- */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold">Package Collateral</h2>
                    <p className="text-sm text-muted-foreground">
                        Add up to 4 collateral items (PDFs, diagrams, references, or videos) to support
                        this package during customer conversations.
                    </p>
                </div>
                <Separator />

                {collateral.length > 0 && (
                    <div className="space-y-3">
                        {collateral.map((item, idx) => (
                            <CollateralRow
                                key={idx}
                                item={item}
                                index={idx}
                                onChange={updateCollateral}
                                onRemove={removeCollateral}
                            />
                        ))}
                    </div>
                )}

                {collateral.length < 4 && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCollateral}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Collateral Item ({collateral.length} / 4)
                    </Button>
                )}

                {collateral.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                        No collateral added yet.
                    </p>
                )}
            </section>

            {/* ---- Form Actions ---- */}
            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEdit ? "Save Changes" : "Create Package"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/packages")}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
