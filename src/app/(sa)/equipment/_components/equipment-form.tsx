"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, AlertCircle, RefreshCcw } from "lucide-react";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMemo } from "react";
import { CreateEquipmentSchema, EquipmentPayload } from "@/lib/zod/equipment";
import { Checkbox } from "@/components/ui/checkbox";

export function EquipmentForm({
    initialData,
    taxonomy,
    services = [],
}: {
    initialData?: any;
    taxonomy?: any;
    services?: any[];
}) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Safely extract taxonomy defaults or empty arrays
    const txExtras = taxonomy?.extraFields || {};
    const roles = txExtras.equipmentRoles || ["WAN", "LAN", "WLAN", "SECURITY"];
    const statuses = txExtras.equipmentStatus || ["Available", "EOS", "EOL"];
    const mgmtSizes = txExtras.managementSizes || ["Small", "Medium", "Large"];
    const environments = txExtras.environments || ["Indoor", "Outdoor"];
    const portTypes = txExtras.portTypes || ["10/100/1000", "1/2.5/5/10 Gbps", "10G SFP+", "40G QSFP"];

    const defaultValues: Partial<EquipmentPayload> = {
        model: initialData?.model || "",
        vendorId: initialData?.vendorId || "",
        description: initialData?.description || "",
        family: initialData?.family || "",
        roles: initialData?.roles || (initialData?.role ? [initialData.role] : []),
        service: initialData?.service || "",
        serviceOption: initialData?.serviceOption || "",
        active: initialData?.active ?? true,
        status: initialData?.status || statuses[0],
        eosDate: initialData?.eosDate ? new Date(initialData.eosDate).toISOString() : "",
        pricing: {
            purchasePrice: initialData?.pricing?.purchasePrice || 0,
            rentalPrice: initialData?.pricing?.rentalPrice || 0,
            managementSize: initialData?.pricing?.managementSize || mgmtSizes[0],
        },
        specs: initialData?.specs || {},
    };

    const form = useForm<any>({
        resolver: zodResolver(CreateEquipmentSchema) as any,
        defaultValues: defaultValues as any,
    });

    const selectedRoles: string[] = form.watch("roles") || [];
    const selectedService = form.watch("service");

    const availableOptions = useMemo(() => {
        if (!selectedService) return [];
        const s = services.find(svc => svc.name === selectedService);
        return s?.serviceOptions || [];
    }, [selectedService, services]);

    const onSubmit = async (data: EquipmentPayload) => {
        setIsSaving(true);
        try {
            const url = initialData ? `/api/equipment/${initialData.id}` : "/api/equipment";
            const method = initialData ? "PUT" : "POST";

            // IfeosDate is empty string, make it null
            const payload: any = { ...data };
            if (!payload.eosDate) {
                payload.eosDate = null;
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to save equipment");
            }

            toast.success(initialData ? "Equipment updated" : "Equipment created");
            router.push("/equipment");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to save equipment");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-end mb-6">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Catalog Entry
                    </Button>
                </div>

                {/* Section 1: Foundational Identity */}
                <Card className="border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-xl">Identity & Lifecycle</CardTitle>
                        <CardDescription>Core properties to classify and manage the status of this hardware.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., MS120-48LP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 48-port Gigabit PoE+ switch" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="family"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Family</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., MS120 Series" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="roles"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Roles (Capabilities)</FormLabel>
                                        <CardDescription>Select all applicable functionality roles</CardDescription>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {roles.map((r: string) => (
                                            <FormField
                                                key={r}
                                                control={form.control}
                                                name="roles"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={r}
                                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(r)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), r])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value: string) => value !== r
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal">
                                                                {r}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {statuses.map((s: string) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active in Catalog</FormLabel>
                                        <CardDescription>If off, this will be hidden from the BOM builder.</CardDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vendorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor SKU / ID (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Internal or vendor identifier" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="eosDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End of Sale Date (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Section 2: Service Mappings */}
                <Card className="border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-xl">Service Catalog Mapping</CardTitle>
                        <CardDescription>Link this equipment to your service logic.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="service"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Mapping</FormLabel>
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            form.setValue("serviceOption", ""); // Reset option on service change
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Service" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {services.map((s: any) => (
                                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="serviceOption"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Option Mapping</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={!selectedService}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedService ? "Select Option" : "Select Service First"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableOptions.map((opt: any) => (
                                                <SelectItem key={opt.optionId} value={opt.name}>{opt.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Section 3: Pricing */}
                <Card className="border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-xl">Financial Details</CardTitle>
                        <CardDescription>Dual-axis hardware cost structure.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="pricing.purchasePrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purchase Price (OTC) $</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pricing.rentalPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rental Price (MRC) $</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pricing.managementSize"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Management Tier</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Size" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mgmtSizes.map((s: string) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Section 4: Progressive Technical Specs based on selected Role */}
                <Accordion type="single" collapsible className="w-full bg-white rounded-lg border border-zinc-200 shadow-sm" defaultValue="specs">
                    <AccordionItem value="specs" className="border-none">
                        <AccordionTrigger className="px-6 hover:no-underline hover:bg-zinc-50 rounded-t-lg data-[state=open]:border-b border-zinc-200">
                            <div className="flex items-center gap-2">
                                <span className="text-xl tracking-tight font-semibold text-zinc-900">Technical Specifications</span>
                                <span className="text-sm font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                                    for {selectedRoles.length > 0 ? selectedRoles.join(" + ") : "Equipment"}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6">

                            {selectedRoles.length === 0 && (
                                <div className="text-zinc-500 italic p-4 text-center">
                                    Select at least one role above to reveal corresponding technical constraint fields.
                                </div>
                            )}

                            {selectedRoles.includes("WAN") && (
                                <div className="space-y-6 mt-2 mb-8">
                                    <div className="border-b border-zinc-200 pb-2">
                                        <h4 className="text-base font-medium text-zinc-900">WAN Specifications</h4>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="specs.rawFirewallThroughputMbps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="uppercase font-semibold text-xs tracking-wider">Raw Firewall (Mbps)</FormLabel>
                                                    <p className="text-[0.8rem] text-muted-foreground mt-1 mb-2 leading-relaxed">
                                                        <span className="font-semibold text-zinc-700">Guidance:</span> Clear-text stateful firewall routing without VPNs or IPS.
                                                    </p>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.sdwanCryptoThroughputMbps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="uppercase font-semibold text-xs tracking-wider">SD-WAN Crypto (Mbps)</FormLabel>
                                                    <p className="text-[0.8rem] text-muted-foreground mt-1 mb-2 leading-relaxed">
                                                        <span className="font-semibold text-zinc-700">Guidance:</span> Throughput with tunnels built but security handled off-box. Look for 'VPN throughput', 'IPsec IMIX', or 'SD-WAN Routing' (e.g. Meraki VPN, Cisco IPsec, HPE Silver Peak)
                                                    </p>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.advancedSecurityThroughputMbps"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="uppercase font-semibold text-xs tracking-wider">Advanced Security (Mbps)</FormLabel>
                                                    <p className="text-[0.8rem] text-muted-foreground mt-1 mb-2 leading-relaxed">
                                                        <span className="font-semibold text-zinc-700">Guidance:</span> Throughput with on-box deep packet inspection (IDS/IPS) active. Look for 'Threat Defense', 'IDS/IPS', or 'Advanced Security' (e.g. Meraki Adv. Sec, Cisco Threat Defense, HPE Aruba).
                                                    </p>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="specs.wanPortCount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>WAN Port Count</FormLabel>
                                                        <FormControl>
                                                            {/* @ts-ignore */}
                                                            <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="specs.wanPortType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>WAN Port Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value as string}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {portTypes.map((pt: string) => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="specs.lanPortCount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>LAN Port Count</FormLabel>
                                                        <FormControl>
                                                            {/* @ts-ignore */}
                                                            <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="specs.lanPortType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>LAN Port Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value as string}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {portTypes.map((pt: string) => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedRoles.includes("LAN") && (
                                <div className="space-y-6 mt-2 mb-8">
                                    <div className="border-b border-zinc-200 pb-2">
                                        <h4 className="text-base font-medium text-zinc-900">LAN Specifications</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="specs.accessPortCount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Access Port Count</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.accessPortType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Access Port Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value as string}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder="Physical Media" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {portTypes.map((pt: string) => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.poeBudgetWatts"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PoE Budget (Watts)</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.isStackable"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border px-4 py-2 mt-auto h-[42px]">
                                                    <FormLabel className="font-normal">Stackable Chassis?</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedRoles.includes("WLAN") && (
                                <div className="space-y-6 mt-2 mb-8">
                                    <div className="border-b border-zinc-200 pb-2">
                                        <h4 className="text-base font-medium text-zinc-900">WLAN Specifications</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="specs.wifiStandard"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Wi-Fi Standard</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input placeholder="e.g., Wi-Fi 6" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.powerDrawWatts"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Power Draw (Watts, from PoE)</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="specs.environment"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Target Environment</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value as string}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder="Where is it deployed?" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {environments.map((env: string) => <SelectItem key={env} value={env}>{env}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </form>
        </Form>
    );
}
