"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";
import {
    Sparkles,
    Upload,
    FileText,
    Loader2,
    CheckCircle2,
    XCircle,
    X,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Check,
    Globe,
} from "lucide-react";

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "text/plain",
];
const ACCEPTED_EXT = ".pdf,.xlsx,.xls,.csv,.txt";

interface ExtractedItem {
    model: string;
    description: string;
    family: string;
    roles: string[];
    service: string | null;
    serviceOption: string | null;
    status: string;
    vendorId: string | null;
    pricing: {
        purchasePrice: number;
        rentalPrice: number;
        managementSize: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    specs: Record<string, any>;
    confidence: number;
    datasheetUrl?: string | null;
    _selected?: boolean;
}

interface DatasheetIngestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    services: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taxonomy: any;
}

type Step = "upload" | "review" | "importing";

export function DatasheetIngestModal({
    open,
    onOpenChange,
    services,
    taxonomy,
}: DatasheetIngestModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("upload");
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<ExtractedItem[]>([]);
    const [editingIdx, setEditingIdx] = useState<number>(0);
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState<
        { model: string; success: boolean; error?: string }[]
    >([]);

    // Taxonomy values
    const txExtras = taxonomy?.extraFields || {};
    const roles = txExtras.equipmentRoles || [];
    const statuses = txExtras.equipmentStatus || [];
    const mgmtSizes = txExtras.managementSizes || [];
    const environments = txExtras.environments || [];
    const portTypes = txExtras.portTypes || [];
    const wifiStandards = txExtras.wifistandard || [];
    const mimoDensities = txExtras.mimoDensity || [];
    const mountingOptions = txExtras.mountingOptions || [];
    const cellularTypes = txExtras.cellularTypes || [];
    const cellularIntegrations = txExtras.cellularIntegrations || [];

    const reset = () => {
        setStep("upload");
        setFiles([]);
        setUrlInput("");
        setError(null);
        setItems([]);
        setEditingIdx(0);
        setImporting(false);
        setImportResults([]);
    };

    const addFiles = useCallback((incoming: FileList | null) => {
        if (!incoming) return;
        const valid = Array.from(incoming).filter(
            (f) =>
                ACCEPTED_TYPES.includes(f.type) ||
                ACCEPTED_EXT.split(",").some((ext) =>
                    f.name.toLowerCase().endsWith(ext)
                )
        );
        setFiles((prev) => {
            const names = new Set(prev.map((f) => f.name));
            return [...prev, ...valid.filter((f) => !names.has(f.name))];
        });
    }, []);

    const removeFile = (name: string) =>
        setFiles((prev) => prev.filter((f) => f.name !== name));

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
        },
        [addFiles]
    );

    async function handleAnalyze() {
        setError(null);
        setAnalyzing(true);

        try {
            const form = new FormData();
            files.forEach((f) => form.append("files", f));
            if (urlInput.trim()) {
                form.append("url", urlInput.trim());
            }

            const response = await fetch("/api/equipment/ingest", {
                method: "POST",
                body: form,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error ?? "Analysis failed");
            }

            const data = await response.json();
            const extracted: ExtractedItem[] = (data.items || []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (item: any) => ({
                    ...item,
                    model: item.model || "",
                    description: item.description || "",
                    family: item.family || "",
                    roles: item.roles || [],
                    service: item.service || null,
                    serviceOption: item.serviceOption || null,
                    status: item.status || "Available",
                    vendorId: item.vendorId || null,
                    datasheetUrl: item.datasheetUrl || (urlInput.trim() || null),
                    pricing: {
                        purchasePrice: item.pricing?.purchasePrice || 0,
                        rentalPrice: item.pricing?.rentalPrice || 0,
                        managementSize: item.pricing?.managementSize || "Small",
                    },
                    specs: item.specs || {},
                    confidence: item.confidence || 0,
                    _selected: true,
                })
            );

            if (extracted.length === 0) {
                throw new Error(
                    "No equipment models detected in the uploaded documents."
                );
            }

            setItems(extracted);
            setEditingIdx(0);
            setStep("review");
        } catch (e: unknown) {
            setError(
                e instanceof Error ? e.message : "An unexpected error occurred"
            );
        } finally {
            setAnalyzing(false);
        }
    }

    function updateItem(idx: number, patch: Partial<ExtractedItem>) {
        setItems((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function updateItemSpec(idx: number, specKey: string, value: any) {
        setItems((prev) =>
            prev.map((item, i) =>
                i === idx
                    ? { ...item, specs: { ...item.specs, [specKey]: value } }
                    : item
            )
        );
    }

    function updateItemPricing(
        idx: number,
        key: string,
        value: number | string
    ) {
        setItems((prev) =>
            prev.map((item, i) =>
                i === idx
                    ? {
                        ...item,
                        pricing: { ...item.pricing, [key]: value },
                    }
                    : item
            )
        );
    }

    const selectedItems = items.filter((i) => i._selected);

    function isItemValid(item: ExtractedItem): boolean {
        return !!(
            item.model &&
            item.description &&
            item.family &&
            item.roles.length > 0 &&
            item.service &&
            item.serviceOption &&
            item.status
        );
    }

    async function handleImport() {
        setImporting(true);
        setStep("importing");
        const results: { model: string; success: boolean; error?: string }[] = [];

        for (const item of selectedItems) {
            try {
                const { _selected: _, confidence: _c, ...payload } = item;
                // Ensure null eosDate
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const body: any = { ...payload, eosDate: null };

                const response = await fetch("/api/equipment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to save");
                }

                results.push({ model: item.model, success: true });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                results.push({
                    model: item.model,
                    success: false,
                    error: e.message,
                });
            }
        }

        setImportResults(results);
        setImporting(false);

        const successCount = results.filter((r) => r.success).length;
        if (successCount > 0) {
            toast.success(
                `${successCount} equipment item${successCount > 1 ? "s" : ""} imported successfully`
            );
            router.refresh();
        }
        if (results.some((r) => !r.success)) {
            toast.error("Some items failed to import. Check details.");
        }
    }

    const currentItem = items[editingIdx];

    const availableOptionsForItem = (serviceName: string | null) => {
        if (!serviceName) return [];
        const s = services.find((svc) => svc.name === serviceName);
        return s?.serviceOptions || [];
    };

    function confidenceColor(c: number) {
        if (c >= 80) return "text-green-600 bg-green-50 border-green-200";
        if (c >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    }

    function confidenceIcon(c: number) {
        if (c >= 80) return <CheckCircle2 className="h-4 w-4" />;
        if (c >= 50) return <AlertTriangle className="h-4 w-4" />;
        return <XCircle className="h-4 w-4" />;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!val) reset();
                onOpenChange(val);
            }}
        >
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        AI Datasheet Ingest
                    </DialogTitle>
                    <DialogDescription>
                        Upload vendor datasheets and let AI extract equipment
                        catalog fields. Review and confirm before importing.
                    </DialogDescription>
                </DialogHeader>

                {/* Step indicator */}
                <div className="flex items-center gap-2 py-2">
                    {(
                        [
                            { key: "upload", label: "Upload" },
                            { key: "review", label: "Review & Confirm" },
                            { key: "importing", label: "Import" },
                        ] as const
                    ).map(({ key, label }, i) => (
                        <div key={key} className="flex items-center gap-2">
                            {i > 0 && (
                                <div className="h-px w-8 bg-zinc-200" />
                            )}
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
                                    step === key
                                        ? "bg-primary text-primary-foreground"
                                        : items.length > 0 && key === "upload"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-zinc-100 text-zinc-500"
                                )}
                            >
                                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                                    {items.length > 0 && key === "upload" ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        i + 1
                                    )}
                                </span>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── STEP 1: UPLOAD ─── */}
                {step === "upload" && (
                    <div className="space-y-4">
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() =>
                                document
                                    .getElementById("ingest-file-input")
                                    ?.click()
                            }
                            className={cn(
                                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                                dragging
                                    ? "border-primary bg-primary/5 scale-[1.01]"
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                            )}
                        >
                            <input
                                id="ingest-file-input"
                                type="file"
                                multiple
                                accept={ACCEPTED_EXT}
                                className="hidden"
                                onChange={(e) => addFiles(e.target.files)}
                            />
                            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                Drop vendor datasheets here or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF, XLSX, CSV, TXT — up to 10 MB each
                            </p>
                        </div>

                        {files.length > 0 && (
                            <ul className="space-y-1.5">
                                {files.map((f) => (
                                    <li
                                        key={f.name}
                                        className="flex items-center gap-2 px-3 py-2 bg-muted/60 rounded-lg text-sm"
                                    >
                                        <FileText className="h-4 w-4 text-primary shrink-0" />
                                        <span className="flex-1 truncate text-xs">
                                            {f.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {(f.size / 1024).toFixed(0)} KB
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(f.name);
                                            }}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Input
                                placeholder="...or paste a Datasheet URL (PDF or Product Page)"
                                className="pl-10 h-10"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                onClick={handleAnalyze}
                                disabled={(files.length === 0 && !urlInput.trim()) || analyzing}
                                className="gap-2"
                            >
                                {analyzing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {analyzing
                                    ? "Analyzing Datasheets..."
                                    : "Analyze with AI"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: REVIEW & CONFIRM ─── */}
                {step === "review" && currentItem && (
                    <div className="space-y-4">
                        {/* Item tabs */}
                        {items.length > 1 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-muted-foreground mr-1">
                                    Models detected:
                                </span>
                                {items.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setEditingIdx(idx)}
                                        className={cn(
                                            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all",
                                            editingIdx === idx
                                                ? "border-primary bg-primary/5 text-primary font-medium"
                                                : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-3 w-3 rounded"
                                            checked={item._selected}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                updateItem(idx, {
                                                    _selected:
                                                        !item._selected,
                                                });
                                            }}
                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }
                                        />
                                        {item.model || `Item ${idx + 1}`}
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                                                confidenceColor(
                                                    item.confidence
                                                )
                                            )}
                                        >
                                            {item.confidence}%
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Confidence banner */}
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
                                confidenceColor(currentItem.confidence)
                            )}
                        >
                            {confidenceIcon(currentItem.confidence)}
                            AI Confidence: {currentItem.confidence}%
                            {currentItem.confidence < 80 && (
                                <span className="font-normal text-xs ml-2 opacity-80">
                                    — Please verify the highlighted fields
                                    carefully
                                </span>
                            )}
                        </div>

                        {/* Editable fields */}
                        <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
                            {/* Identity */}
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Identity & Lifecycle
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <FieldRow
                                        label="Model *"
                                        value={currentItem.model}
                                        onChange={(v) =>
                                            updateItem(editingIdx, {
                                                model: v,
                                            })
                                        }
                                        required
                                    />
                                    <FieldRow
                                        label="Description *"
                                        value={currentItem.description}
                                        onChange={(v) =>
                                            updateItem(editingIdx, {
                                                description: v,
                                            })
                                        }
                                        required
                                    />
                                    <FieldRow
                                        label="Family *"
                                        value={currentItem.family}
                                        onChange={(v) =>
                                            updateItem(editingIdx, {
                                                family: v,
                                            })
                                        }
                                        required
                                    />
                                    <FieldRow
                                        label="Vendor SKU"
                                        value={currentItem.vendorId || ""}
                                        onChange={(v) =>
                                            updateItem(editingIdx, {
                                                vendorId: v || null,
                                            })
                                        }
                                    />
                                    <FieldRow
                                        label="Datasheet Reference (URL)"
                                        value={currentItem.datasheetUrl || ""}
                                        onChange={(v) =>
                                            updateItem(editingIdx, {
                                                datasheetUrl: v || null,
                                            })
                                        }
                                    />
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Roles *
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {roles.map((r: string) => {
                                                const checked =
                                                    currentItem.roles.includes(r);
                                                return (
                                                    <label
                                                        key={r}
                                                        className={cn(
                                                            "flex items-center gap-1.5 text-xs px-2 py-1 rounded border cursor-pointer transition-colors",
                                                            checked
                                                                ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                                                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-3 w-3 rounded"
                                                            checked={checked}
                                                            onChange={() => {
                                                                const newRoles =
                                                                    checked
                                                                        ? currentItem.roles.filter(
                                                                            (
                                                                                v
                                                                            ) =>
                                                                                v !==
                                                                                r
                                                                        )
                                                                        : [
                                                                            ...currentItem.roles,
                                                                            r,
                                                                        ];
                                                                updateItem(
                                                                    editingIdx,
                                                                    {
                                                                        roles: newRoles,
                                                                    }
                                                                );
                                                            }}
                                                        />
                                                        {r}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Status *
                                        </label>
                                        <Select
                                            value={currentItem.status}
                                            onValueChange={(v) =>
                                                updateItem(editingIdx, {
                                                    status: v,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s: string) => (
                                                    <SelectItem
                                                        key={s}
                                                        value={s}
                                                    >
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Service Mapping */}
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Service Catalog Mapping
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Service *
                                        </label>
                                        <Select
                                            value={
                                                currentItem.service || ""
                                            }
                                            onValueChange={(v) => {
                                                updateItem(editingIdx, {
                                                    service: v,
                                                    serviceOption: null,
                                                });
                                            }}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    "h-8 text-xs",
                                                    !currentItem.service &&
                                                    "border-amber-300 bg-amber-50"
                                                )}
                                            >
                                                <SelectValue placeholder="Select Service" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {services.map((s: any) => (
                                                    <SelectItem
                                                        key={s.id}
                                                        value={s.name}
                                                    >
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Service Option *
                                        </label>
                                        <Select
                                            value={
                                                currentItem.serviceOption || ""
                                            }
                                            onValueChange={(v) =>
                                                updateItem(editingIdx, {
                                                    serviceOption: v,
                                                })
                                            }
                                            disabled={!currentItem.service}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    "h-8 text-xs",
                                                    !currentItem.serviceOption &&
                                                    "border-amber-300 bg-amber-50"
                                                )}
                                            >
                                                <SelectValue
                                                    placeholder={
                                                        currentItem.service
                                                            ? "Select Option"
                                                            : "Select Service First"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableOptionsForItem(
                                                    currentItem.service
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                ).map((opt: any) => (
                                                    <SelectItem
                                                        key={
                                                            opt.optionId ||
                                                            opt.name
                                                        }
                                                        value={opt.name}
                                                    >
                                                        {opt.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Financial Details
                                    <span className="text-[10px] font-normal text-zinc-400 ml-1">
                                        (manual entry)
                                    </span>
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Purchase Price (OTC) $
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            className="h-8 text-xs"
                                            value={
                                                currentItem.pricing
                                                    .purchasePrice
                                            }
                                            onChange={(e) =>
                                                updateItemPricing(
                                                    editingIdx,
                                                    "purchasePrice",
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Rental Price (MRC) $
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            className="h-8 text-xs"
                                            value={
                                                currentItem.pricing.rentalPrice
                                            }
                                            onChange={(e) =>
                                                updateItemPricing(
                                                    editingIdx,
                                                    "rentalPrice",
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                            Management Tier
                                        </label>
                                        <Select
                                            value={
                                                currentItem.pricing
                                                    .managementSize
                                            }
                                            onValueChange={(v) =>
                                                updateItemPricing(
                                                    editingIdx,
                                                    "managementSize",
                                                    v
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mgmtSizes.map(
                                                    (s: string) => (
                                                        <SelectItem
                                                            key={s}
                                                            value={s}
                                                        >
                                                            {s}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Specs */}
                            {currentItem.roles.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                        Technical Specifications
                                        <span className="text-[10px] font-normal text-zinc-400 ml-1">
                                            for{" "}
                                            {currentItem.roles.join(
                                                " + "
                                            )}
                                        </span>
                                    </h4>

                                    {currentItem.roles.includes("WAN") && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                                                WAN
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <FieldRow
                                                    label="Raw Firewall (Mbps)"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .rawFirewallThroughputMbps ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "rawFirewallThroughputMbps",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="SD-WAN Crypto (Mbps)"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .sdwanCryptoThroughputMbps ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "sdwanCryptoThroughputMbps",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="Adv. Security (Mbps)"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .advancedSecurityThroughputMbps ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "advancedSecurityThroughputMbps",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="WAN Port Count"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .wanPortCount ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "wanPortCount",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="WAN Port Type"
                                                    value={
                                                        currentItem.specs
                                                            .wanPortType || ""
                                                    }
                                                    options={portTypes}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "wanPortType",
                                                            v
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="LAN Port Count"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .lanPortCount ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "lanPortCount",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="LAN Port Type"
                                                    value={
                                                        currentItem.specs
                                                            .lanPortType || ""
                                                    }
                                                    options={portTypes}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "lanPortType",
                                                            v
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="Cellular Type"
                                                    value={
                                                        currentItem.specs
                                                            .cellularType || ""
                                                    }
                                                    options={cellularTypes}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "cellularType",
                                                            v
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="Cellular Integration"
                                                    value={
                                                        currentItem.specs
                                                            .cellularIntegration || ""
                                                    }
                                                    options={cellularIntegrations}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "cellularIntegration",
                                                            v
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {currentItem.roles.includes("LAN") && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                                                LAN
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <FieldRow
                                                    label="Access Port Count"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .accessPortCount ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "accessPortCount",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="Access Port Type"
                                                    value={
                                                        currentItem.specs
                                                            .accessPortType ||
                                                        ""
                                                    }
                                                    options={portTypes}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "accessPortType",
                                                            v
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="Uplink Port Count"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .uplinkPortCount ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "uplinkPortCount",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="Uplink Port Type"
                                                    value={
                                                        currentItem.specs
                                                            .uplinkPortType ||
                                                        ""
                                                    }
                                                    options={portTypes}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "uplinkPortType",
                                                            v
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="PoE Budget (W)"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .poeBudgetWatts ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "poeBudgetWatts",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                                        Stackable?
                                                    </label>
                                                    <div className="flex items-center gap-2 h-8">
                                                        <Switch
                                                            checked={
                                                                currentItem
                                                                    .specs
                                                                    .isStackable ||
                                                                false
                                                            }
                                                            onCheckedChange={(
                                                                v
                                                            ) =>
                                                                updateItemSpec(
                                                                    editingIdx,
                                                                    "isStackable",
                                                                    v
                                                                )
                                                            }
                                                        />
                                                        <span className="text-xs text-zinc-500">
                                                            {currentItem.specs
                                                                .isStackable
                                                                ? "Yes"
                                                                : "No"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentItem.roles.includes("WLAN") && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                                                WLAN
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <SelectFieldRow
                                                    label="Wi-Fi Standard"
                                                    value={
                                                        currentItem.specs
                                                            .wifiStandard || ""
                                                    }
                                                    options={wifiStandards}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "wifiStandard",
                                                            v
                                                        )
                                                    }
                                                />
                                                <FieldRow
                                                    label="Power Draw (W)"
                                                    type="number"
                                                    value={
                                                        currentItem.specs
                                                            .powerDrawWatts ??
                                                        ""
                                                    }
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "powerDrawWatts",
                                                            v
                                                                ? parseInt(v)
                                                                : undefined
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="Environment"
                                                    value={
                                                        currentItem.specs
                                                            .environment || ""
                                                    }
                                                    options={environments}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "environment",
                                                            v
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="Uplink Type"
                                                    value={
                                                        currentItem.specs
                                                            .uplinkType || ""
                                                    }
                                                    options={portTypes}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "uplinkType",
                                                            v
                                                        )
                                                    }
                                                />
                                                <SelectFieldRow
                                                    label="MIMO Density"
                                                    value={
                                                        currentItem.specs
                                                            .mimoDensity || ""
                                                    }
                                                    options={mimoDensities}
                                                    onChange={(v) =>
                                                        updateItemSpec(
                                                            editingIdx,
                                                            "mimoDensity",
                                                            v
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <label className="text-xs font-medium text-zinc-600 mb-1 block">
                                                        Mounting Options
                                                    </label>
                                                    <div className="flex flex-wrap gap-1">
                                                        {mountingOptions.map(
                                                            (opt: string) => {
                                                                const current: string[] =
                                                                    currentItem
                                                                        .specs
                                                                        .mountingOptions ||
                                                                    [];
                                                                const checked =
                                                                    current.includes(
                                                                        opt
                                                                    );
                                                                return (
                                                                    <label
                                                                        key={
                                                                            opt
                                                                        }
                                                                        className={cn(
                                                                            "text-[10px] px-1.5 py-0.5 rounded border cursor-pointer",
                                                                            checked
                                                                                ? "bg-primary/10 border-primary/30 text-primary"
                                                                                : "bg-zinc-50 border-zinc-200 text-zinc-500"
                                                                        )}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className="hidden"
                                                                            checked={
                                                                                checked
                                                                            }
                                                                            onChange={() => {
                                                                                const newV =
                                                                                    checked
                                                                                        ? current.filter(
                                                                                            (
                                                                                                v
                                                                                            ) =>
                                                                                                v !==
                                                                                                opt
                                                                                        )
                                                                                        : [
                                                                                            ...current,
                                                                                            opt,
                                                                                        ];
                                                                                updateItemSpec(
                                                                                    editingIdx,
                                                                                    "mountingOptions",
                                                                                    newV
                                                                                );
                                                                            }}
                                                                        />
                                                                        {opt}
                                                                    </label>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStep("upload")}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back to Upload
                            </Button>

                            {items.length > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={editingIdx === 0}
                                        onClick={() =>
                                            setEditingIdx((p) => p - 1)
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs text-zinc-500">
                                        {editingIdx + 1} / {items.length}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={
                                            editingIdx === items.length - 1
                                        }
                                        onClick={() =>
                                            setEditingIdx((p) => p + 1)
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                size="sm"
                                onClick={handleImport}
                                disabled={
                                    selectedItems.length === 0 ||
                                    !selectedItems.every(isItemValid)
                                }
                                className="gap-1.5"
                            >
                                <Check className="h-4 w-4" />
                                Confirm Import
                                {selectedItems.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 h-5 text-[10px]"
                                    >
                                        {selectedItems.length} item
                                        {selectedItems.length > 1 ? "s" : ""}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: IMPORTING / RESULTS ─── */}
                {step === "importing" && (
                    <div className="space-y-4 py-4">
                        {importing ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Importing equipment to catalog...
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-zinc-900">
                                    Import Results
                                </h4>
                                {importResults.map((r, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
                                            r.success
                                                ? "bg-green-50 border-green-200 text-green-800"
                                                : "bg-red-50 border-red-200 text-red-800"
                                        )}
                                    >
                                        {r.success ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="font-medium">
                                            {r.model}
                                        </span>
                                        {r.success ? (
                                            <span className="text-xs">
                                                — Imported successfully
                                            </span>
                                        ) : (
                                            <span className="text-xs">
                                                — {r.error}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            reset();
                                            onOpenChange(false);
                                        }}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            reset();
                                        }}
                                    >
                                        Import More
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Reusable tiny field components ───

function FieldRow({
    label,
    value,
    onChange,
    type = "text",
    required,
}: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
}) {
    const isEmpty = required && !value;
    return (
        <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">
                {label}
            </label>
            <Input
                type={type}
                className={cn(
                    "h-8 text-xs",
                    isEmpty && "border-amber-300 bg-amber-50"
                )}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function SelectFieldRow({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">
                {label}
            </label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    {options.map((o) => (
                        <SelectItem key={o} value={o}>
                            {o}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
