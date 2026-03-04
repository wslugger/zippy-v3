"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload, AlertTriangle, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface Price {
    id: string;
    sku: string;
    listPrice: number;
    currency: string;
    effectiveDate: string;
}

interface PricingClientPageProps {
    initialPrices: Price[];
    orphanLicenseSkus: string[];
    orphanEquipmentSkus: string[];
}

// ── CSV Uploader ─────────────────────────────────────────────
function CsvUploader({ onImported }: { onImported: () => void }) {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [skuCol, setSkuCol] = useState("");
    const [priceCol, setPriceCol] = useState("");
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.trim().split("\n").map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
            if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row."); return; }
            setHeaders(lines[0]);
            setRows(lines.slice(1));
            setSkuCol(lines[0][0] ?? "");
            setPriceCol(lines[0][1] ?? "");
            setOpen(true);
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleImport = async () => {
        const skuIdx = headers.indexOf(skuCol);
        const priceIdx = headers.indexOf(priceCol);
        if (skuIdx === -1 || priceIdx === -1) { toast.error("Invalid column mapping"); return; }

        const payload = rows
            .filter((r) => r[skuIdx] && !isNaN(parseFloat(r[priceIdx])))
            .map((r) => ({
                sku: r[skuIdx],
                listPrice: parseFloat(r[priceIdx]),
                currency: "USD",
                effectiveDate: new Date().toISOString(),
            }));

        if (payload.length === 0) { toast.error("No valid rows found in CSV"); return; }

        setLoading(true);
        try {
            const res = await fetch("/api/prices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Import failed");
            toast.success(`Imported ${data.created} price entries`);
            setOpen(false);
            onImported();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Map CSV Columns</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-zinc-500 mb-4">
                        Found <strong>{rows.length}</strong> data rows. Map the columns below before importing.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">SKU Column</label>
                            <Select value={skuCol} onValueChange={setSkuCol}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">List Price Column</label>
                            <Select value={priceCol} onValueChange={setPriceCol}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleImport} disabled={loading}>
                            {loading ? "Importing…" : "Confirm Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PricingClientPage({
    initialPrices,
    orphanLicenseSkus,
    orphanEquipmentSkus,
}: PricingClientPageProps) {
    const router = useRouter();
    const [prices, setPrices] = useState<Price[]>(initialPrices);
    const [addOpen, setAddOpen] = useState(false);
    const [newSku, setNewSku] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newCurrency, setNewCurrency] = useState("USD");
    const [saving, setSaving] = useState(false);

    const refresh = async () => {
        const res = await fetch("/api/prices");
        if (res.ok) { setPrices(await res.json()); router.refresh(); }
    };

    const handleDelete = async (id: string, sku: string) => {
        if (!confirm(`Delete price for SKU "${sku}"?`)) return;
        const res = await fetch(`/api/prices/${id}`, { method: "DELETE" });
        if (res.ok) { toast.success("Price deleted"); setPrices((p) => p.filter((x) => x.id !== id)); }
        else toast.error("Failed to delete price");
    };

    const handleAdd = async () => {
        if (!newSku || !newPrice) return;
        setSaving(true);
        try {
            const res = await fetch("/api/prices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku: newSku,
                    listPrice: parseFloat(newPrice),
                    currency: newCurrency,
                    effectiveDate: new Date().toISOString(),
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
            toast.success("Price added");
            setAddOpen(false);
            setNewSku(""); setNewPrice(""); setNewCurrency("USD");
            refresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to add price");
        } finally {
            setSaving(false);
        }
    };

    const totalOrphans = orphanLicenseSkus.length + orphanEquipmentSkus.length;

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="Price Book"
                    description="Flat price catalog keyed by SKU — used for equipment, services, and licenses."
                />
                <div className="flex items-center gap-2">
                    <CsvUploader onImported={refresh} />
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Price
                    </Button>
                </div>
            </div>

            {/* Orphan Detection Alert */}
            {totalOrphans > 0 && (
                <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Missing Prices Detected</AlertTitle>
                    <AlertDescription className="text-amber-700 space-y-1 mt-1">
                        {orphanLicenseSkus.length > 0 && (
                            <p>
                                <strong>{orphanLicenseSkus.length} License SKU{orphanLicenseSkus.length > 1 ? "s" : ""}</strong> have no price entry:{" "}
                                <span className="font-mono text-xs">{orphanLicenseSkus.join(", ")}</span>
                            </p>
                        )}
                        {orphanEquipmentSkus.length > 0 && (
                            <p>
                                <strong>{orphanEquipmentSkus.length} Equipment SKU{orphanEquipmentSkus.length > 1 ? "s" : ""}</strong> have no price entry:{" "}
                                <span className="font-mono text-xs">{orphanEquipmentSkus.join(", ")}</span>
                            </p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Price Table */}
            {prices.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-xl border-2 border-dashed border-zinc-200">
                    <DollarSign className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                    <p className="text-zinc-500 italic">No prices yet. Import a CSV or add manually.</p>
                </div>
            ) : (
                <div className="rounded-xl border bg-white overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50">
                                <TableHead className="font-semibold">SKU</TableHead>
                                <TableHead className="font-semibold">List Price</TableHead>
                                <TableHead className="font-semibold">Currency</TableHead>
                                <TableHead className="font-semibold">Effective Date</TableHead>
                                <TableHead className="w-16" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prices.map((p) => (
                                <TableRow key={p.id} className="hover:bg-zinc-50/50">
                                    <TableCell className="font-mono text-sm text-zinc-600">{p.sku}</TableCell>
                                    <TableCell className="font-semibold">
                                        {p.listPrice.toLocaleString("en-US", { style: "currency", currency: p.currency })}
                                    </TableCell>
                                    <TableCell className="text-zinc-500">{p.currency}</TableCell>
                                    <TableCell className="text-zinc-500 text-sm">
                                        {new Date(p.effectiveDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => handleDelete(p.id, p.sku)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Manual Add Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add Price Entry</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">SKU</label>
                            <Input placeholder="e.g., MX105" value={newSku} onChange={(e) => setNewSku(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">List Price</label>
                            <Input type="number" min={0} step={0.01} placeholder="0.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Currency</label>
                            <Select value={newCurrency} onValueChange={setNewCurrency}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["USD", "EUR", "GBP", "AUD", "CAD"].map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={saving || !newSku || !newPrice}>
                            {saving ? "Saving…" : "Add Price"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
