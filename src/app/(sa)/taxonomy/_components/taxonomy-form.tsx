"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, X, Save, RefreshCcw, Trash2, Edit2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const taxonomySchema = z.record(z.string(), z.array(z.string()));

type TaxonomyValues = z.infer<typeof taxonomySchema>;

export function TaxonomyForm({ initialData }: { initialData?: any }) {
    const [isSaving, setIsSaving] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const form = useForm<TaxonomyValues>({
        resolver: zodResolver(taxonomySchema),
        defaultValues: initialData || {},
    });

    const categories = Object.keys(form.watch());

    const onSubmit = async (data: TaxonomyValues) => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/taxonomy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save taxonomy");

            toast.success("Global taxonomy updated successfully");
        } catch (error) {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const addCategory = () => {
        const name = newCategoryName.trim();
        if (!name) return;

        // Convert display name to camelCase key
        const key = name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());

        if (form.getValues(key)) {
            toast.error("A category with a similar name already exists");
            return;
        }

        form.setValue(key, [], { shouldDirty: true });
        setNewCategoryName("");
        toast.success(`Category "${name}" added`);
    };

    const removeCategory = (key: string) => {
        const currentValues = form.getValues();
        const { [key]: removed, ...rest } = currentValues;
        form.reset(rest, { keepDirty: true });
        toast.success("Category removed");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
                <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 border-b mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Global Taxonomy</h1>
                        <p className="text-zinc-500 mt-1">Manage shared lists and dictionaries used across the application.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="New category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-48 bg-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCategory();
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={addCategory}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                            {isSaving ? (
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map((key) => (
                        <TaxonomySection
                            key={key}
                            form={form}
                            name={key}
                            onRemove={() => removeCategory(key)}
                        />
                    ))}
                </div>
            </form>
        </Form>
    );
}

function TaxonomySection({ form, name, onRemove }: any) {
    const [inputValue, setInputValue] = useState("");
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelInput, setLabelInput] = useState(name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()));
    const { watch, setValue } = form;
    const items = watch(name) || [];

    const addItem = () => {
        if (!inputValue.trim()) return;
        if (items.includes(inputValue.trim())) {
            toast.error("Item already exists in this list");
            return;
        }
        setValue(name, [...items, inputValue.trim()], { shouldDirty: true });
        setInputValue("");
    };

    const removeItem = (itemToRemove: string) => {
        setValue(name, items.filter((i: string) => i !== itemToRemove), { shouldDirty: true });
    };

    const handleLabelChange = () => {
        // In a real app, renaming keys in a flat JSON object can be tricky if you want to keep data.
        // For simplicity here, we just update the UI label state if the user wants to visually change it,
        // but the underlying key stays the same for database stability.
        // To truly rename the key, we'd need to emit a rename event to the parent.
        setIsEditingLabel(false);
    };

    return (
        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-all group/card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        {isEditingLabel ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={labelInput}
                                    onChange={(e) => setLabelInput(e.target.value)}
                                    className="h-8 py-0 focus-visible:ring-0"
                                    autoFocus
                                    onBlur={handleLabelChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleLabelChange();
                                    }}
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleLabelChange}>
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <CardTitle className="text-lg flex items-center gap-2">
                                {labelInput}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                    onClick={() => setIsEditingLabel(true)}
                                >
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                            </CardTitle>
                        )}
                        <CardDescription className="text-xs">Category: {name}</CardDescription>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Taxonomy Category?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove the entire &quot;{labelInput}&quot; category and all its entries. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onRemove} className="bg-red-600 hover:bg-red-700">
                                    Delete Category
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-zinc-50 rounded-md border border-dashed border-zinc-200">
                        {items.length === 0 && <span className="text-sm text-zinc-400 italic px-2">No items added yet...</span>}
                        {items.map((item: string) => (
                            <Badge key={item} variant="secondary" className="px-3 py-1 bg-white border border-zinc-200 text-zinc-700 flex items-center gap-1 group/badge">
                                {item}
                                <button
                                    type="button"
                                    onClick={() => removeItem(item)}
                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Add item..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addItem();
                                }
                            }}
                            className="bg-white h-9"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addItem}
                            className="shrink-0 h-9"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
