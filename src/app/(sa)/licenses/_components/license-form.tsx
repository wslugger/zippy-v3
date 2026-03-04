"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, ChevronsUpDown, Check, KeyRound, Cpu, Package, Clock, Tag, Building2, ToggleRight } from "lucide-react";
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

// Reusable styled label with icon
function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{children}</span>
        </div>
    );
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">

                {/* ── Identity ─────────────────────────────── */}
                <div className="px-6 pt-4 pb-5 space-y-4">
                    <div className="grid grid-cols-5 gap-3">
                        {/* SKU — narrow */}
                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <SectionLabel icon={Tag}>SKU</SectionLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="LIC-MX105-ADV-36"
                                            className="font-mono text-sm h-9"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Name — wide */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="col-span-3">
                                    <SectionLabel icon={KeyRound}>License Name</SectionLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Meraki MX105 Advanced Security"
                                            className="h-9"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        {/* Vendor — wide */}
                        <FormField
                            control={form.control}
                            name="vendor"
                            render={({ field }) => (
                                <FormItem className="col-span-3">
                                    <SectionLabel icon={Building2}>Vendor</SectionLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9">
                                                <SelectValue
                                                    placeholder={
                                                        vendors.length
                                                            ? "Select a vendor…"
                                                            : "No vendors — add services first"
                                                    }
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vendors.length === 0 && (
                                                <div className="px-3 py-4 text-center text-xs text-zinc-400">
                                                    No vendors found in active services.
                                                </div>
                                            )}
                                            {vendors.map((v) => (
                                                <SelectItem key={v} value={v}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Term — narrow */}
                        <FormField
                            control={form.control}
                            name="termMonths"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <SectionLabel icon={Clock}>Term (mo)</SectionLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input
                                            type="number"
                                            min={1}
                                            className="h-9"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* ── Divider ───────────────────────────────── */}
                <div className="border-t border-zinc-100 mx-0" />

                {/* ── Associations ─────────────────────────── */}
                <div className="px-6 py-5 space-y-4 bg-zinc-50/60">

                    {/* Supported Hardware combobox */}
                    <FormField
                        control={form.control}
                        name="supportedHardware"
                        render={() => (
                            <FormItem>
                                <SectionLabel icon={Cpu}>Supported Hardware SKUs</SectionLabel>
                                <Popover open={hwOpen} onOpenChange={setHwOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full h-9 justify-between font-normal bg-white",
                                                selectedHw.length > 0 && "border-violet-300 text-violet-700"
                                            )}
                                        >
                                            <span className="text-sm">
                                                {selectedHw.length > 0
                                                    ? `${selectedHw.length} hardware SKU${selectedHw.length > 1 ? "s" : ""} selected`
                                                    : <span className="text-zinc-400">Search by SKU or model…</span>}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[420px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Filter by SKU or model name…" className="h-9" />
                                            <CommandList>
                                                <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
                                                    No equipment in catalog yet.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {equipmentOptions.map((eq) => (
                                                        <CommandItem
                                                            key={eq.sku}
                                                            value={`${eq.sku} ${eq.name}`}
                                                            onSelect={() => toggleHw(eq.sku)}
                                                            className="flex items-center gap-2 py-2"
                                                        >
                                                            <div className={cn(
                                                                "flex h-4 w-4 items-center justify-center rounded border",
                                                                selectedHw.includes(eq.sku)
                                                                    ? "bg-violet-600 border-violet-600"
                                                                    : "border-zinc-300"
                                                            )}>
                                                                {selectedHw.includes(eq.sku) && (
                                                                    <Check className="h-3 w-3 text-white" />
                                                                )}
                                                            </div>
                                                            <span className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{eq.sku}</span>
                                                            <span className="text-sm text-zinc-700">{eq.name}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedHw.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {selectedHw.map((sku: string) => (
                                            <Badge
                                                key={sku}
                                                variant="outline"
                                                className="gap-1 font-mono text-[11px] border-violet-200 bg-violet-50 text-violet-700 pr-1"
                                            >
                                                {sku}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHw(sku)}
                                                    className="ml-0.5 rounded-full hover:bg-violet-100 p-0.5"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
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
                                <SectionLabel icon={Package}>Supported Packages</SectionLabel>
                                <Popover open={pkgOpen} onOpenChange={setPkgOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full h-9 justify-between font-normal bg-white",
                                                selectedPkgs.length > 0 && "border-sky-300 text-sky-700"
                                            )}
                                        >
                                            <span className="text-sm">
                                                {selectedPkgs.length > 0
                                                    ? `${selectedPkgs.length} package${selectedPkgs.length > 1 ? "s" : ""} selected`
                                                    : <span className="text-zinc-400">Search packages…</span>}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[420px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Filter by package name or slug…" className="h-9" />
                                            <CommandList>
                                                <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
                                                    No packages in catalog yet.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {packageOptions.map((pkg) => (
                                                        <CommandItem
                                                            key={pkg.slug}
                                                            value={`${pkg.slug} ${pkg.name}`}
                                                            onSelect={() => togglePkg(pkg.slug)}
                                                            className="flex items-center gap-2 py-2"
                                                        >
                                                            <div className={cn(
                                                                "flex h-4 w-4 items-center justify-center rounded border",
                                                                selectedPkgs.includes(pkg.slug)
                                                                    ? "bg-sky-600 border-sky-600"
                                                                    : "border-zinc-300"
                                                            )}>
                                                                {selectedPkgs.includes(pkg.slug) && (
                                                                    <Check className="h-3 w-3 text-white" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-zinc-700">{pkg.name}</span>
                                                            <span className="ml-auto font-mono text-[10px] text-zinc-400">{pkg.slug}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedPkgs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {selectedPkgs.map((slug: string) => {
                                            const pkg = packageOptions.find((p) => p.slug === slug);
                                            return (
                                                <Badge
                                                    key={slug}
                                                    variant="outline"
                                                    className="gap-1 text-[11px] border-sky-200 bg-sky-50 text-sky-700 pr-1"
                                                >
                                                    {pkg?.name ?? slug}
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePkg(slug)}
                                                        className="ml-0.5 rounded-full hover:bg-sky-100 p-0.5"
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* ── Divider ───────────────────────────────── */}
                <div className="border-t border-zinc-100" />

                {/* ── Footer: Active + Actions ──────────────── */}
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                    {/* Active toggle */}
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-3 m-0 space-y-0">
                                <FormControl>
                                    {/* @ts-ignore */}
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div>
                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                        Active
                                    </FormLabel>
                                    <p className="text-xs text-zinc-400 leading-none mt-0.5">
                                        {field.value ? "Visible in catalog" : "Hidden from catalog"}
                                    </p>
                                </div>
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-zinc-500">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSaving} className="min-w-[120px]">
                            {isSaving ? "Saving…" : initialData ? "Update License" : "Create License"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
