"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Check, ChevronsUpDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const featureSchema = z.object({
    name: z.string().min(2, "Name is required"),
    service: z.string().min(2, "Service is required"),
    status: z.string().min(2, "Status is required"),
    description: z.string().optional(),
    caveats: z.array(z.string()),
    assumptions: z.array(z.string()),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

interface FeatureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature?: any;
    onSuccess: () => void;
}

export function FeatureDialog({
    open,
    onOpenChange,
    feature,
    onSuccess,
}: FeatureDialogProps) {
    const isEditing = !!feature;

    const [services, setServices] = useState<{ id: string, name: string }[]>([]);
    const [taxonomy, setTaxonomy] = useState<any>({});
    const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch("/api/services");
                if (response.ok) {
                    const data = await response.json();
                    setServices(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch services:", error);
            }
        };

        const fetchTaxonomy = async () => {
            try {
                setLoadingTaxonomy(true);
                const response = await fetch("/api/taxonomy");
                if (response.ok) {
                    const data = await response.json();
                    setTaxonomy(data || {});
                }
            } catch (error) {
                console.error("Failed to fetch taxonomy:", error);
            } finally {
                setLoadingTaxonomy(false);
            }
        };

        fetchServices();
        fetchTaxonomy();
    }, []);

    // The user-created "Status" category is stored in extraFields. We check case-insensitively.
    const customStatusKey = taxonomy.extraFields
        ? Object.keys(taxonomy.extraFields).find((k) => k.toLowerCase() === "status")
        : undefined;
    const customStatuses = customStatusKey ? taxonomy.extraFields[customStatusKey] : null;

    const featureStatuses = (customStatuses && customStatuses.length > 0)
        ? customStatuses
        : ["Supported", "Planned", "Beta", "Deprecated"];

    const form = useForm<FeatureFormValues>({
        resolver: zodResolver(featureSchema),
        defaultValues: {
            name: "",
            service: "",
            status: featureStatuses[0] || "Supported",
            description: "",
            caveats: [],
            assumptions: [],
        },
    });

    useEffect(() => {
        if (feature) {
            form.reset({
                name: feature.name,
                service: feature.service,
                status: feature.status,
                description: feature.description || "",
                caveats: feature.caveats || [],
                assumptions: feature.assumptions || [],
            });
        } else {
            form.reset({
                name: "",
                service: "",
                status: featureStatuses[0] || "Supported",
                description: "",
                caveats: [],
                assumptions: [],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feature, form, open, featureStatuses[0]]);

    const onSubmit = async (data: FeatureFormValues) => {
        try {
            const url = isEditing ? `/api/features/${feature.id}` : "/api/features";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save feature");

            toast.success(isEditing ? "Feature updated" : "Feature created");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("An error occurred while saving the feature");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-2xl font-bold">
                        {isEditing ? "Edit Feature" : "New Feature"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Advanced Monitoring" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="service"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select service" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {services.map((s) => (
                                                    <SelectItem key={s.id} value={s.name}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {featureStatuses.map((status: string) => (
                                                    <SelectItem key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        Description
                                        <span className="text-blue-500">✨</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detailed explanation of the capability..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="caveats"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Caveats (one per line)
                                            <span className="text-blue-500">✨</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Limitations or constraints..."
                                                className="min-h-[120px]"
                                                value={field.value.join("\n")}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value.split("\n").filter((l) => l.trim())
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assumptions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Assumptions (one per line)
                                            <span className="text-blue-500">✨</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="What needs to be true for this to work..."
                                                className="min-h-[120px]"
                                                value={field.value.join("\n")}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value.split("\n").filter((l) => l.trim())
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                            >
                                {isEditing ? "Save Feature" : "Create Feature"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
