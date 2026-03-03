"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save, Wand2, Sparkles, Check } from "lucide-react";
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
        <Tabs defaultValue="editor" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
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
                <Accordion type="multiple" className="w-full">
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
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-6 pt-2 pb-6">
                                    {/* Service Options */}
                                    {inc.includedOptions?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-muted-foreground border-b pb-1">Service Options</h4>
                                            <div className="space-y-3">
                                                {inc.includedOptions.map((optInc: any) => {
                                                    const optionDef = serviceDef.serviceOptions?.find((o: any) => o.optionId === optInc.optionId);
                                                    const isRequired = optInc.designation === "required";
                                                    const isSelected = isRequired || sState.selectedOptions.includes(optInc.optionId);

                                                    const toggleOption = (checked: boolean) => {
                                                        if (isRequired) return; // cannot toggle required
                                                        setServiceState(inc.serviceId, (prev: any) => {
                                                            const opts = new Set(prev.selectedOptions);
                                                            if (checked) opts.add(optInc.optionId);
                                                            else opts.delete(optInc.optionId);
                                                            return { ...prev, selectedOptions: Array.from(opts) };
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
                                                    return Object.entries(choiceGroups).map(([groupId, choices]: [string, any]) => (
                                                        <div key={groupId} className="p-3 border rounded bg-background/50 space-y-3">
                                                            <h5 className="font-medium">{groupId} (Group)</h5>
                                                            <div className="space-y-2 pl-2">
                                                                {choices.map((choiceInc: any) => {
                                                                    const isRequired = choiceInc.designation === "required";
                                                                    const groupSelection = sState.selectedDesignChoices[groupId] || [];
                                                                    const isSelected = isRequired || groupSelection.includes(choiceInc.choiceValue);

                                                                    const toggleChoice = (checked: boolean) => {
                                                                        if (isRequired) return;
                                                                        setServiceState(inc.serviceId, (prev: any) => {
                                                                            const grps = { ...prev.selectedDesignChoices };
                                                                            const active = new Set(grps[groupId] || []);
                                                                            if (checked) active.add(choiceInc.choiceValue);
                                                                            else active.delete(choiceInc.choiceValue);
                                                                            grps[groupId] = Array.from(active);
                                                                            return { ...prev, selectedDesignChoices: grps };
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
                                                                                {choiceInc.choiceValue}
                                                                            </Label>
                                                                            <div className="ml-auto scale-90 opacity-80">
                                                                                <DesignationBadge designation={choiceInc.designation} />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ));
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
                                    setFormState((prev: any) => ({
                                        ...prev,
                                        execSummary: data.execSummary,
                                        conclusion: data.conclusion
                                    }));
                                    toast.success("Design output generated!");
                                } catch (error) {
                                    toast.error("Failed to generate summary with AI");
                                } finally {
                                    setIsGeneratingProxy(false);
                                }
                            }} disabled={isGeneratingProxy}>
                                <Wand2 className="mr-2 h-4 w-4" />
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
                                <div key={sState.serviceId} className="space-y-2 border-b pb-4 last:border-0">
                                    <h4 className="font-bold text-lg">{inc.serviceName}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">{serviceDef.shortDescription}</p>

                                    {sState.selectedOptions.length > 0 && (
                                        <div className="pl-4 space-y-1">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Chosen Options:</p>
                                            {sState.selectedOptions.map((oid: string) => {
                                                const oDef = serviceDef.serviceOptions.find((so: any) => so.optionId === oid);
                                                return <div key={oid} className="text-sm flex items-center gap-2"><Check size={14} className="text-green-600" /> {oDef?.name}</div>;
                                            })}
                                        </div>
                                    )}

                                    {Object.entries(sState.selectedDesignChoices).some(([_, v]: any) => v.length > 0) && (
                                        <div className="pl-4 space-y-1 mt-2">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Design Choices:</p>
                                            {Object.entries(sState.selectedDesignChoices).map(([gid, vals]: [string, any]) => (
                                                vals.map((v: string) => <div key={`${gid}-${v}`} className="text-sm flex items-center gap-2"><Check size={14} className="text-blue-600" /> {gid}: {v}</div>)
                                            ))}
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
                                    serviceDef.caveats?.forEach((c: string) => activeCaveats.add(c));
                                }

                                // features are active if their service is in package inclusion and the feature is included
                                const inc = inclusions.find((i: any) => i.serviceId === sState.serviceId);
                                if (inc && inc.includedFeatures) {
                                    inc.includedFeatures.forEach((featInc: any) => {
                                        const fDef = features.find((f: any) => f.name === featInc.featureSlug);
                                        if (fDef) {
                                            fDef.assumptions?.forEach((a: string) => activeAssumptions.add(a));
                                            fDef.caveats?.forEach((c: string) => activeCaveats.add(c));
                                        }
                                    });
                                }
                            });

                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold border-b pb-2">Assumptions</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {activeAssumptions.size > 0
                                                ? Array.from(activeAssumptions).map((a, i) => <li key={i}>{a}</li>)
                                                : <li className="text-muted-foreground italic">None</li>}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold border-b pb-2">Caveats</h4>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {activeCaveats.size > 0
                                                ? Array.from(activeCaveats).map((c, i) => <li key={i}>{c}</li>)
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
