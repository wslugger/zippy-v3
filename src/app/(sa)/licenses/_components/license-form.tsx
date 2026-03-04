"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { CreateLicenseSchema, CreateLicenseInput } from "@/lib/zod/license";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EquipmentLookup { sku: string; name: string; }
interface PackageLookup { slug: string; name: string; }

interface LicenseFormProps {
    initialData?: Record<string, unknown>;
    onSuccess: () => void;
    onCancel: () => void;
}

export function LicenseForm({ initialData, onSuccess, onCancel }: LicenseFormProps) {
    const [vendors, setVendors] = useState<string[]>([]);
    const [equipmentOptions, setEquipmentOptions] = useState<EquipmentLookup[]>([]);
    const [packageOptions, setPackageOptions] = useState<PackageLookup[]>([]);
    const [hwOpen, setHwOpen] = useState(false);
    const [pkgOpen, setPkgOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = useForm<any>({
        resolver: zodResolver(CreateLicenseSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            sku: (initialData?.sku as string) ?? "",
            name: (initialData?.name as string) ?? "",
            termMonths: (initialData?.termMonths as number) ?? 12,
            vendor: (initialData?.vendor as string) ?? "",
            supportedHardware: (initialData?.supportedHardware as string[]) ?? [],
            supportedPackages: (initialData?.supportedPackages as string[]) ?? [],
            isActive: (initialData?.isActive as boolean) ?? true,
        },
    });

    // Load lookup data — guard against non-array responses in case of API errors
    useEffect(() => {
        const safeArray = <T,>(val: unknown): T[] => (Array.isArray(val) ? (val as T[]) : []);

        Promise.all([
            fetch("/api/lookups/service-vendors").then((r) => r.json()).catch(() => []),
            fetch("/api/lookups/equipment").then((r) => r.json()).catch(() => []),
            fetch("/api/lookups/packages").then((r) => r.json()).catch(() => []),
        ]).then(([v, e, p]) => {
            setVendors(safeArray<string>(v));
            setEquipmentOptions(safeArray<EquipmentLookup>(e));
            setPackageOptions(safeArray<PackageLookup>(p));
        });
    }, []);

    const selectedHw = form.watch("supportedHardware");
    const selectedPkgs = form.watch("supportedPackages");

    const toggleHw = (sku: string) => {
        const current = form.getValues("supportedHardware");
        form.setValue(
            "supportedHardware",
            current.includes(sku) ? current.filter((s: string) => s !== sku) : [...current, sku]
        );
    };

    const togglePkg = (slug: string) => {
        const current = form.getValues("supportedPackages");
        form.setValue(
            "supportedPackages",
            current.includes(slug) ? current.filter((s: string) => s !== slug) : [...current, slug]
        );
    };

    const onSubmit = async (data: CreateLicenseInput) => {
        setIsSaving(true);
        try {
            const url = initialData ? `/api/licenses/${initialData.id}` : "/api/licenses";
            const method = initialData ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save license");
            }
            toast.success(initialData ? "License updated" : "License created");
            onSuccess();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save license");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Row 1: SKU + Name */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SKU</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., LIC-MX105-ADV-36" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Meraki MX105 Advanced Security" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Row 2: Vendor + Term */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="vendor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={vendors.length ? "Select vendor" : "No vendors configured"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {vendors.map((v) => (
                                            <SelectItem key={v} value={v}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="termMonths"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Term (Months)</FormLabel>
                                <FormControl>
                                    {/* @ts-ignore */}
                                    <Input type="number" min={1} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Supported Hardware combobox */}
                <FormField
                    control={form.control}
                    name="supportedHardware"
                    render={() => (
                        <FormItem>
                            <FormLabel>Supported Hardware SKUs</FormLabel>
                            <Popover open={hwOpen} onOpenChange={setHwOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                        {selectedHw.length > 0 ? `${selectedHw.length} selected` : "Search hardware…"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search by SKU or model…" />
                                        <CommandList>
                                            <CommandEmpty>No equipment found.</CommandEmpty>
                                            <CommandGroup>
                                                {equipmentOptions.map((eq) => (
                                                    <CommandItem
                                                        key={eq.sku}
                                                        value={`${eq.sku} ${eq.name}`}
                                                        onSelect={() => toggleHw(eq.sku)}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedHw.includes(eq.sku) ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-mono text-xs mr-2 text-zinc-500">{eq.sku}</span>
                                                        {eq.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedHw.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedHw.map((sku: string) => (
                                        <Badge key={sku} variant="secondary" className="gap-1">
                                            {sku}
                                            <button type="button" onClick={() => toggleHw(sku)}><X className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Supported Packages combobox */}
                <FormField
                    control={form.control}
                    name="supportedPackages"
                    render={() => (
                        <FormItem>
                            <FormLabel>Supported Packages</FormLabel>
                            <Popover open={pkgOpen} onOpenChange={setPkgOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                        {selectedPkgs.length > 0 ? `${selectedPkgs.length} selected` : "Search packages…"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search by name or slug…" />
                                        <CommandList>
                                            <CommandEmpty>No packages found.</CommandEmpty>
                                            <CommandGroup>
                                                {packageOptions.map((pkg) => (
                                                    <CommandItem
                                                        key={pkg.slug}
                                                        value={`${pkg.slug} ${pkg.name}`}
                                                        onSelect={() => togglePkg(pkg.slug)}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedPkgs.includes(pkg.slug) ? "opacity-100" : "opacity-0")} />
                                                        {pkg.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedPkgs.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedPkgs.map((slug: string) => {
                                        const pkg = packageOptions.find((p) => p.slug === slug);
                                        return (
                                            <Badge key={slug} variant="secondary" className="gap-1">
                                                {pkg?.name ?? slug}
                                                <button type="button" onClick={() => togglePkg(slug)}><X className="h-3 w-3" /></button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Active toggle */}
                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                            <FormLabel className="font-normal">Active</FormLabel>
                            <FormControl>
                                {/* @ts-ignore */}
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving…" : initialData ? "Update License" : "Create License"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
