"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Save,
    ChevronRight,
    ExternalLink,
    Check,
    FileText,
    BookOpen,
    AlertCircle,
    Archive,
    Layout,
    RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import {
    Card, CardContent, CardDescription, CardFooter,
    CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// We can define minimal types for props based on our schema
export function DesignForm({ project, packageData, services, features }: any) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingProxy, setIsGeneratingProxy] = useState(false);
    const [isAutoSelecting, setIsAutoSelecting] = useState(false);
    const [openSections, setOpenSections] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("editor");

    const inclusions = packageData.includedServices || [];

    // Initialize state based on existing design configuration or default inclusions
    const initializeState = () => {
        if (project.designConfiguration?.services?.length > 0) {
            return project.designConfiguration;
        }

        // Generate defaults
        const servicesState = exclusionsToState(inclusions);
        return {
            execSummary: "This is a placeholder Exec Summary based on your selections.",
            conclusion: "Conclusion placeholder.",
            services: servicesState,
        };
    };

    const exclusionsToState = (incs: any[]) => {
        return incs.map((inc) => {
            // required + standard are selected by default for options
            const selectedOptions = inc.includedOptions
                ?.filter((o: any) => o.designation === "required" || o.designation === "standard")
                .map((o: any) => o.optionId) || [];

            // same for design choices
            const selectedDesignChoices: Record<string, string[]> = {};
            inc.includedDesignChoices?.forEach((c: any) => {
                if (c.designation === "required" || c.designation === "standard") {
                    if (!selectedDesignChoices[c.groupId]) {
                        selectedDesignChoices[c.groupId] = [];
                    }
                    selectedDesignChoices[c.groupId].push(c.choiceValue);
                }
            });

            return {
                serviceId: inc.serviceId,
                selectedOptions,
                selectedDesignChoices,
                aiRecommended: {} // stores flags
            };
        });
    };

    const [formState, setFormState] = useState<any>(initializeState());

    const handleAutoSelect = async () => {
        setIsAutoSelecting(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/design/auto-select`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Auto-select failed");
            const data = await res.json();

            // data.services is an array of recommendations
            setFormState((prev: any) => ({
                ...prev,
                services: prev.services.map((s: any) => {
                    const rec = data.services.find((r: any) => r.serviceId === s.serviceId);
                    if (!rec) return s;

                    // Mark which items were recommended
                    const aiRecommended: Record<string, boolean> = {};
                    rec.selectedOptions.forEach((oid: string) => aiRecommended[oid] = true);
                    Object.entries(rec.selectedDesignChoices).forEach(([gid, vals]: [string, any]) => {
                        vals.forEach((v: string) => aiRecommended[`${gid}-${v}`] = true);
                    });

                    return {
                        ...s,
                        selectedOptions: Array.from(new Set([...s.selectedOptions, ...rec.selectedOptions])),
                        selectedDesignChoices: {
                            ...s.selectedDesignChoices,
                            ...rec.selectedDesignChoices
                        },
                        aiRecommended,
                        reasoning: rec.reasoning
                    };
                })
            }));

            // Expand sections with recommendations and switch to editor
            const sectionsToOpen = data.services
                .filter((r: any) => (r.selectedOptions?.length || 0) > 0 || Object.keys(r.selectedDesignChoices || {}).length > 0)
                .map((r: any) => r.serviceId);
            setOpenSections(sectionsToOpen);
            setActiveTab("editor");

            toast.success("AI suggests the following configuration based on requirements.");
        } catch (err) {
            toast.error("AI auto-select failed");
        } finally {
            setIsAutoSelecting(false);
        }
    };

    const handleSave = async (completeModule: boolean = false) => {
        setIsSaving(true);
        try {
            const updateData: any = { designConfiguration: formState };
            if (completeModule) {
                updateData.moduleStates = { configuration: "completed" };
            } else {
                updateData.moduleStates = { configuration: "in_progress" };
            }

            const res = await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(completeModule ? "Design marked as complete!" : "Design saved successfully!");
            router.refresh();
            if (completeModule) {
                // redirect back to project overview
                router.push(`/projects/${project.id}`);
            }
        } catch (err) {
            toast.error("Error saving design");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper getters
    const getServiceState = (serviceId: string) => {
        return formState.services.find((s: any) => s.serviceId === serviceId);
    };

    const setServiceState = (serviceId: string, updater: (s: any) => any) => {
        setFormState((prev: any) => ({
            ...prev,
            services: prev.services.map((s: any) =>
                s.serviceId === serviceId ? updater(s) : s
            ),
        }));
    };

    const DesignationBadge = ({ designation }: { designation: string }) => {
        if (designation === "required") return <Badge variant="default">Required</Badge>;
        if (designation === "standard") return <Badge variant="secondary">Standard</Badge>;
        if (designation === "optional") return <Badge variant="outline">Optional</Badge>;
        return null;
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <TabsList>
                    <TabsTrigger value="editor" className="flex items-center gap-2">
                        Editor
                        {Object.values(formState.services).some((s: any) => Object.keys(s.aiRecommended || {}).length > 0) && (
                            <Sparkles size={12} className="text-primary animate-pulse" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="review">Review & Output</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleAutoSelect} disabled={isAutoSelecting || isSaving}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isAutoSelecting ? "Analyzing..." : "Auto-Suggest Design"}
                    </Button>
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" /> Save Draft
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={isSaving}>
                        Mark Complete
                    </Button>
                </div>
            </div>

            <TabsContent value="editor" className="space-y-4">
                <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
                    {inclusions.map((inc: any) => {
                        const serviceDef = services.find((s: any) => s.id === inc.serviceId);
                        if (!serviceDef) return null;

                        const sState = getServiceState(inc.serviceId);
                        if (!sState) return null;

                        return (
                            <AccordionItem key={inc.serviceId} value={inc.serviceId} className="bg-card border rounded-lg px-4 mb-4">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="font-semibold text-lg">{inc.serviceName}</div>
                                        <DesignationBadge designation={inc.designation} />
                                        {Object.keys(sState.aiRecommended || {}).length > 0 && (
                                            <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-left-2 duration-500">
                                                <Sparkles size={12} className="fill-primary/20" />
                                                AI Recommended
                                            </div>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-6 pt-2 pb-6">
                                    {/* AI Reasoning Banner */}
                                    {sState.reasoning && (
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                            <div className="mt-0.5 text-primary shrink-0">
                                                <Sparkles size={18} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider">AI Reasoning</p>
                                                <p className="text-sm text-zinc-700 leading-relaxed italic">
                                                    "{sState.reasoning}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Service Options */}
                                    {inc.includedOptions?.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b pb-1">
                                                <h4 className="font-medium text-muted-foreground">Service Options</h4>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                    {(inc.optionsSelectionType || "multi") === "single" ? "Single Select" : "Multi Select"}
                                                </Badge>
                                            </div>
                                            <div className="space-y-3">
                                                {inc.includedOptions.map((optInc: any) => {
                                                    const optionDef = serviceDef.serviceOptions?.find((o: any) => o.optionId === optInc.optionId);
                                                    const isRequired = optInc.designation === "required";
                                                    const isSelected = isRequired || sState.selectedOptions.includes(optInc.optionId);
                                                    const selectionType = inc.optionsSelectionType || "multi";

                                                    const toggleOption = (checked: boolean) => {
                                                        if (isRequired) return; // cannot toggle required
                                                        setServiceState(inc.serviceId, (prev: any) => {
                                                            let nextOptions = Array.isArray(prev.selectedOptions) ? [...prev.selectedOptions] : [];
                                                            if (selectionType === "single") {
                                                                if (checked) {
                                                                    nextOptions = [optInc.optionId];
                                                                } else {
                                                                    nextOptions = nextOptions.filter(id => id !== optInc.optionId);
                                                                }
                                                            } else {
                                                                if (checked) {
                                                                    if (!nextOptions.includes(optInc.optionId)) {
                                                                        nextOptions.push(optInc.optionId);
                                                                    }
                                                                } else {
                                                                    nextOptions = nextOptions.filter(id => id !== optInc.optionId);
                                                                }
                                                            }
                                                            return { ...prev, selectedOptions: nextOptions };
                                                        });
                                                    };

                                                    return (
                                                        <div key={optInc.optionId} className="flex gap-4 items-start p-3 border rounded bg-background/50">
                                                            <Checkbox
                                                                id={`opt-${optInc.optionId}`}
                                                                checked={isSelected}
                                                                onCheckedChange={toggleOption}
                                                                disabled={isRequired}
                                                                className="mt-1"
                                                            />
                                                            {sState.aiRecommended?.[optInc.optionId] && (
                                                                <div className="mt-1 text-primary animate-pulse" title="Recommended from requirements">
                                                                    <Sparkles size={16} />
                                                                </div>
                                                            )}
                                                            <div className="space-y-1 w-full">
                                                                <Label htmlFor={`opt-${optInc.optionId}`} className="text-base font-medium leading-none cursor-pointer flex justify-between">
                                                                    <span>{optionDef?.name || "Unknown Option"}</span>
                                                                    <DesignationBadge designation={optInc.designation} />
                                                                </Label>
                                                                <p className="text-sm text-muted-foreground">{optionDef?.description}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Design Choices */}
                                    {inc.includedDesignChoices?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-muted-foreground border-b pb-1">Design Choices</h4>
                                            <div className="space-y-4">
                                                {/* Group design choices by groupId for rendering */}
                                                {(() => {
                                                    const choiceGroups = inc.includedDesignChoices.reduce((acc: any, c: any) => {
                                                        if (!acc[c.groupId]) acc[c.groupId] = [];
                                                        acc[c.groupId].push(c);
                                                        return acc;
                                                    }, {});

                                                    const getDesignLabels = (groupId: string, choiceValue: string) => {
                                                        const slugify = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                                                        const gidLower = groupId.toLowerCase();

                                                        for (const opt of (serviceDef.serviceOptions || []) as any[]) {
                                                            for (const group of (opt.designOptions || []) as any[]) {
                                                                const currentGidLower = (group.groupId || "").toLowerCase();
                                                                const groupLabelLower = (group.groupLabel || "").toLowerCase();

                                                                if (currentGidLower === gidLower || groupLabelLower === gidLower) {
                                                                    const choice = group.choices?.find((c: any) => {
                                                                        const cId = (c.id || "").toLowerCase();
                                                                        const cVal = (c.value || "").toLowerCase();
                                                                        const cNameLower = (c.name || "").toLowerCase();
                                                                        const targetLower = choiceValue.toLowerCase();

                                                                        return (
                                                                            cId === targetLower ||
                                                                            cVal === targetLower ||
                                                                            cNameLower === targetLower ||
                                                                            slugify(c.name || "") === targetLower ||
                                                                            slugify(c.name || "") === slugify(choiceValue)
                                                                        );
                                                                    });

                                                                    if (choice) {
                                                                        return {
                                                                            groupLabel: group.groupLabel || group.label || groupId,
                                                                            groupDescription: group.description,
                                                                            choiceLabel: choice.name || choice.label || choiceValue,
                                                                            choiceDescription: choice.description || choice.shortDescription || "",
                                                                            selectionType: group.selectionType || "single"
                                                                        };
                                                                    }

                                                                    return {
                                                                        groupLabel: group.groupLabel || group.label || groupId,
                                                                        groupDescription: group.description,
                                                                        choiceLabel: choiceValue,
                                                                        choiceDescription: "",
                                                                        selectionType: group.selectionType || "single"
                                                                    };
                                                                }
                                                            }
                                                        }
                                                        return { groupLabel: groupId, groupDescription: "", choiceLabel: choiceValue, choiceDescription: "", selectionType: "single" };
                                                    };

                                                    return Object.entries(choiceGroups).map(([groupId, choices]: [string, any]) => {
                                                        // Get group label and default selection type from the first choice lookup
                                                        const { groupLabel, selectionType: defaultST } = getDesignLabels(groupId, choices[0]?.choiceValue);

                                                        // Fallback chain: Package Setting -> Service Definition -> "single"
                                                        const selectionType = inc.designChoiceGroupSettings?.find((s: any) => s.groupId === groupId)?.selectionType
                                                            || defaultST;

                                                        return (
                                                            <div key={groupId} className="p-3 border rounded bg-background/50 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <h5 className="font-medium">{groupLabel}</h5>
                                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                                        {selectionType === "single" ? "Single Select" : "Multi Select"}
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-2 pl-2">
                                                                    {choices.map((choiceInc: any) => {
                                                                        const isRequired = choiceInc.designation === "required";
                                                                        const groupSelection = sState.selectedDesignChoices[groupId] || [];
                                                                        const isSelected = isRequired || groupSelection.includes(choiceInc.choiceValue);
                                                                        const { choiceLabel } = getDesignLabels(groupId, choiceInc.choiceValue);

                                                                        const toggleChoice = (checked: boolean) => {
                                                                            if (isRequired) return;
                                                                            setServiceState(inc.serviceId, (prev: any) => {
                                                                                const grps = { ...prev.selectedDesignChoices };
                                                                                let active = Array.isArray(grps[groupId]) ? [...grps[groupId]] : [];

                                                                                if (selectionType === "single") {
                                                                                    if (checked) {
                                                                                        active = [choiceInc.choiceValue];
                                                                                    } else {
                                                                                        // If single select, we might allow unselect, or enforce at least one
                                                                                        // For now, let's allow unselect unless it's required
                                                                                        active = active.filter(v => v !== choiceInc.choiceValue);
                                                                                    }
                                                                                } else {
                                                                                    if (checked) {
                                                                                        if (!active.includes(choiceInc.choiceValue)) {
                                                                                            active.push(choiceInc.choiceValue);
                                                                                        }
                                                                                    } else {
                                                                                        active = active.filter(v => v !== choiceInc.choiceValue);
                                                                                    }
                                                                                }

                                                                                return {
                                                                                    ...prev,
                                                                                    selectedDesignChoices: {
                                                                                        ...grps,
                                                                                        [groupId]: active
                                                                                    }
                                                                                };
                                                                            });
                                                                        };
                                                                        return (
                                                                            <div key={choiceInc.choiceValue} className="flex items-center gap-3">
                                                                                <Checkbox
                                                                                    id={`choice-${choiceInc.choiceValue}`}
                                                                                    checked={isSelected}
                                                                                    onCheckedChange={toggleChoice}
                                                                                    disabled={isRequired}
                                                                                />
                                                                                {sState.aiRecommended?.[`${groupId}-${choiceInc.choiceValue}`] && (
                                                                                    <div className="text-primary animate-pulse" title="Recommended from requirements">
                                                                                        <Sparkles size={14} />
                                                                                    </div>
                                                                                )}
                                                                                <Label htmlFor={`choice-${choiceInc.choiceValue}`} className="cursor-pointer">
                                                                                    {choiceLabel}
                                                                                </Label>
                                                                                <div className="ml-auto scale-90 opacity-80">
                                                                                    <DesignationBadge designation={choiceInc.designation} />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Features (Readonly) */}
                                    {inc.includedFeatures?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-muted-foreground border-b pb-1">Features</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {inc.includedFeatures.map((featInc: any) => (
                                                    <Badge key={featInc.featureSlug} variant="outline" className="text-xs py-1">
                                                        {features.find((f: any) => f.name === featInc.featureSlug)?.name || featInc.featureSlug}
                                                        <span className="ml-2 opacity-50 capitalize">({featInc.designation})</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Executive Summary</CardTitle>
                                <CardDescription>Generated based on your customer requirements and selections.</CardDescription>
                            </div>
                            <Button variant="secondary" size="sm" onClick={async () => {
                                setIsGeneratingProxy(true);
                                try {
                                    const res = await fetch(`/api/projects/${project.id}/design/generate-summary`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ designConfiguration: formState })
                                    });
                                    if (!res.ok) throw new Error("Generation failed");
                                    const data = await res.json();
                                    console.log("[Generate w/ AI response]", data);
                                    setFormState((prev: any) => ({
                                        ...prev,
                                        execSummary: data.execSummary || data.exec_summary || data.executive_summary || prev.execSummary,
                                        conclusion: data.conclusion || data.Conclusion || prev.conclusion
                                    }));
                                    toast.success("Design output generated!");
                                } catch (error) {
                                    toast.error("Failed to generate summary with AI");
                                } finally {
                                    setIsGeneratingProxy(false);
                                }
                            }} disabled={isGeneratingProxy}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {isGeneratingProxy ? "Generating..." : "Regenerate w/ AI"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={formState.execSummary}
                            onChange={(e) => setFormState((p: any) => ({ ...p, execSummary: e.target.value }))}
                            className="min-h-[200px]"
                        />
                    </CardContent>
                </Card>

                {/* Caveats and Assumptions could be aggregated here */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Design Output</CardTitle>
                        <CardDescription>Chosen services and options in this package</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {formState.services.map((sState: any) => {
                            const inc = inclusions.find((i: any) => i.serviceId === sState.serviceId);
                            const serviceDef = services.find((s: any) => s.id === sState.serviceId);
                            if (!inc || !serviceDef) return null;

                            return (
                                <div key={sState.serviceId} className="space-y-4 border-b pb-6 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-lg text-zinc-900">{inc.serviceName}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{serviceDef.description}</p>
                                    </div>

                                    {sState.selectedOptions.length > 0 && (
                                        <div className="pl-4 space-y-3">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Chosen Options</p>
                                            {sState.selectedOptions.map((oid: string) => {
                                                const oDef = serviceDef.serviceOptions.find((so: any) => (so.optionId || so.id) === oid);
                                                return (
                                                    <div key={oid} className="space-y-1">
                                                        <div className="text-sm font-semibold flex items-center gap-2 text-zinc-800">
                                                            <Check size={14} className="text-green-600 shrink-0" />
                                                            {oDef?.name}
                                                        </div>
                                                        {oDef?.description && (
                                                            <p className="text-sm text-muted-foreground pl-5 leading-relaxed">{oDef.description}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {Object.entries(sState.selectedDesignChoices).some(([_, v]: any) => v.length > 0) && (
                                        <div className="pl-4 space-y-4 mt-6">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Architecture & Design Selections</p>
                                            <div className="space-y-6">
                                                {(() => {
                                                    const getLabel = (gid: string, val: string) => {
                                                        const slugify = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                                                        const gidLower = gid.toLowerCase();
                                                        let fallbackGroup: any = null;

                                                        for (const opt of (serviceDef.serviceOptions || []) as any[]) {
                                                            for (const group of (opt.designOptions || []) as any[]) {
                                                                const currentGidLower = (group.groupId || "").toLowerCase();
                                                                const groupLabelLower = (group.groupLabel || "").toLowerCase();

                                                                if (currentGidLower === gidLower || groupLabelLower === gidLower) {
                                                                    const choice = group.choices?.find((c: any) => {
                                                                        const cId = (c.id || "").toLowerCase();
                                                                        const cVal = (c.value || "").toLowerCase();
                                                                        const cNameLower = (c.name || "").toLowerCase();
                                                                        const targetLower = val.toLowerCase();
                                                                        return (
                                                                            cId === targetLower ||
                                                                            cVal === targetLower ||
                                                                            cNameLower === targetLower ||
                                                                            slugify(c.name || "") === targetLower ||
                                                                            slugify(c.name || "") === slugify(val)
                                                                        );
                                                                    });
                                                                    if (choice) {
                                                                        return {
                                                                            gLabel: group.groupLabel || gid,
                                                                            gDesc: group.description,
                                                                            cLabel: choice.name || val,
                                                                            cDesc: choice.description || choice.shortDescription || (choice as any).longDescription || ""
                                                                        };
                                                                    }
                                                                    if (!fallbackGroup) fallbackGroup = group;
                                                                }
                                                            }
                                                        }
                                                        if (fallbackGroup) {
                                                            return { gLabel: fallbackGroup.groupLabel || gid, gDesc: fallbackGroup.description, cLabel: val, cDesc: "" };
                                                        }
                                                        return { gLabel: gid, gDesc: "", cLabel: val, cDesc: "" };
                                                    };

                                                    return (
                                                        <div className="space-y-8">
                                                            {Object.entries(sState.selectedDesignChoices).map(([gid, vals]: [string, any]) => {
                                                                if (!vals || vals.length === 0) return null;
                                                                const firstLabel = getLabel(gid, vals[0]);

                                                                return (
                                                                    <div key={gid} className="space-y-4">
                                                                        <div className="pb-2 border-b border-zinc-100">
                                                                            <h5 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                                                {firstLabel.gLabel}
                                                                            </h5>
                                                                            {firstLabel.gDesc && (
                                                                                <p className="text-xs text-muted-foreground mt-1 italic">{firstLabel.gDesc}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-4 pl-4">
                                                                            {vals.map((v: string) => {
                                                                                const { cLabel, cDesc } = getLabel(gid, v);
                                                                                const isAiRecommended = sState.aiRecommended?.[`${gid}-${v}`] || sState.aiRecommended?.[v];
                                                                                return (
                                                                                    <div key={`${gid}-${v}`} className="flex gap-4 group/item relative">
                                                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 transition-colors group-hover/item:bg-primary/10">
                                                                                            {isAiRecommended ? <Sparkles size={14} className="text-primary animate-pulse" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                                                                                        </div>
                                                                                        <div className="space-y-1 w-full">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <p className="font-bold text-sm text-zinc-900">{cLabel}</p>
                                                                                                {isAiRecommended && (
                                                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 bg-primary/5 text-primary border-primary/20 uppercase tracking-tighter">AI Suggestion</Badge>
                                                                                                )}
                                                                                            </div>
                                                                                            {cDesc && <p className="text-sm text-zinc-600 leading-relaxed font-medium">{cDesc}</p>}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Reasoning in Review */}
                                                            {sState.reasoning && (
                                                                <div className="mt-8 p-6 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Sparkles size={14} className="text-primary opacity-60" />
                                                                        <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">AI Selection Reasoning</h5>
                                                                    </div>
                                                                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                                                                        "{sState.reasoning}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Conclusion</CardTitle>
                        <CardDescription>Final thoughts and alignment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={formState.conclusion}
                            onChange={(e) => setFormState((p: any) => ({ ...p, conclusion: e.target.value }))}
                            className="min-h-[100px]"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Appendix: Caveats & Assumptions</CardTitle>
                        <CardDescription>Aggregated from all active services and features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(() => {
                            const activeAssumptions = new Set<string>();
                            const activeCaveats = new Set<string>();

                            // Iterate through active services
                            formState.services?.forEach((sState: any) => {
                                const serviceDef = services.find((s: any) => s.id === sState.serviceId);
                                if (serviceDef) {
                                    serviceDef.assumptions?.forEach((a: string) => activeAssumptions.add(a));
                                    // Handle both naming conventions
                                    serviceDef.constraints?.forEach((c: string) => activeCaveats.add(c));
                                    serviceDef.caveats?.forEach((c: string) => activeCaveats.add(c));

                                    // 1. Add from selected Service Options
                                    sState.selectedOptions?.forEach((oid: string) => {
                                        const oDef = serviceDef.serviceOptions?.find((so: any) => (so.optionId || so.id) === oid);
                                        if (oDef) {
                                            oDef.assumptions?.forEach((a: string) => activeAssumptions.add(a));
                                            oDef.constraints?.forEach((c: string) => activeCaveats.add(c));
                                            oDef.caveats?.forEach((c: string) => activeCaveats.add(c));
                                        }
                                    });

                                    // 2. Add from selected Design Choices
                                    Object.entries(sState.selectedDesignChoices || {}).forEach(([groupId, choiceValues]) => {
                                        const vals = choiceValues as string[];
                                        vals.forEach(val => {
                                            // Find the choice definition
                                            serviceDef.serviceOptions?.forEach((so: any) => {
                                                so.designOptions?.forEach((group: any) => {
                                                    if (group.groupId === groupId) {
                                                        const choiceDef = group.choices?.find((c: any) => (c.value || c.id) === val);
                                                        if (choiceDef) {
                                                            choiceDef.assumptions?.forEach((a: string) => activeAssumptions.add(a));
                                                            choiceDef.constraints?.forEach((c: string) => activeCaveats.add(c));
                                                            choiceDef.caveats?.forEach((c: string) => activeCaveats.add(c));
                                                        }
                                                    }
                                                });
                                            });
                                        });
                                    });
                                }

                                // 3. Add from included features
                                const inc = inclusions.find((i: any) => i.serviceId === sState.serviceId);
                                if (inc && inc.includedFeatures) {
                                    inc.includedFeatures.forEach((featInc: any) => {
                                        const fDef = features.find((f: any) => f.name === featInc.featureSlug);
                                        if (fDef) {
                                            fDef.assumptions?.forEach((a: string) => activeAssumptions.add(a));
                                            fDef.constraints?.forEach((c: string) => activeCaveats.add(c));
                                            fDef.caveats?.forEach((c: string) => activeCaveats.add(c));
                                        }
                                    });
                                }
                            });

                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold border-b pb-2">Caveats</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {activeCaveats.size > 0
                                                ? Array.from(activeCaveats).map((c, i) => <li key={i}>{c}</li>)
                                                : <li className="text-muted-foreground italic">None</li>}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold border-b pb-2">Assumptions</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {activeAssumptions.size > 0
                                                ? Array.from(activeAssumptions).map((a, i) => <li key={i}>{a}</li>)
                                                : <li className="text-muted-foreground italic">None</li>}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
