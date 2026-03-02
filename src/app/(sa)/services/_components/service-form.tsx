"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, ChevronLeft, Save, Search, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const designOptionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    decisionDriver: z.string().optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    assumptions: z.array(z.string()).optional(),
});

const serviceOptionSchema = z.object({
    optionId: z.string().min(1, "Option ID is required"),
    name: z.string().min(1, "Name is required"),
    shortDescription: z.string().min(1, "Short description is required"),
    description: z.string().optional().or(z.literal("")),
    features: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    assumptions: z.array(z.string()).optional(),
    designOptions: z.array(z.object({
        groupId: z.string(),
        groupLabel: z.string(),
        choices: z.array(designOptionSchema)
    })).optional(),
});

const serviceSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    shortDescription: z.string().min(5, "Short description must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    isActive: z.boolean(),
    features: z.array(z.string()),
    constraints: z.array(z.string()),
    assumptions: z.array(z.string()),
    serviceOptions: z.array(serviceOptionSchema),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
    initialData?: any;
    serviceId?: string;
}

export function ServiceForm({ initialData, serviceId }: ServiceFormProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("general");
    const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
    const [featureSearch, setFeatureSearch] = useState("");
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
            shortDescription: initialData?.shortDescription || "",
            description: initialData?.description || "",
            isActive: initialData?.isActive ?? true,
            features: initialData?.features || [],
            constraints: initialData?.constraints || [],
            assumptions: initialData?.assumptions || [],
            serviceOptions: initialData?.serviceOptions || [],
        },
    });

    const { fields: serviceOptions, append: appendServiceOption, remove: removeServiceOption } = useFieldArray({
        control: form.control,
        name: "serviceOptions",
    });

    useEffect(() => {
        async function loadFeatures() {
            try {
                const res = await fetch("/api/features");
                if (res.ok) {
                    const data = await res.json();
                    setAvailableFeatures(data);
                }
            } catch (error) {
                toast.error("Failed to load features catalog");
            } finally {
                setLoadingFeatures(false);
            }
        }
        loadFeatures();
    }, []);

    const onInvalid = (errors: any) => {
        // Log keys and full error object to help debug "empty object" issues
        console.error("Form Validation Errors:", {
            keys: Object.keys(errors),
            details: errors,
            raw: JSON.stringify(errors, null, 2)
        });

        toast.error("Please fix the validation errors before saving.");

        // Automatically switch to the tab with the first error
        if (errors.name || errors.slug || errors.shortDescription || errors.description) {
            setActiveTab("general");
        } else if (errors.serviceOptions || errors.features || errors.constraints || errors.assumptions) {
            // These are more likely to be on the options/general tab depending on layout
            // serviceOptions is definitely the second tab
            if (errors.serviceOptions) {
                setActiveTab("options");
            } else {
                setActiveTab("general");
            }
        }
    };

    const onSubmit = async (data: ServiceFormValues) => {
        try {
            const url = serviceId ? `/api/services/${serviceId}` : "/api/services";
            const method = serviceId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save service");
            }

            toast.success(serviceId ? "Service updated" : "Service created");
            router.push("/services");
            router.refresh();
        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error(error.message || "An error occurred while saving the service");
        }
    };

    const filteredFeatures = availableFeatures.filter(f =>
        f.name.toLowerCase().includes(featureSearch.toLowerCase()) ||
        (f.service && f.service.toLowerCase().includes(featureSearch.toLowerCase()))
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/services">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {serviceId ? `Edit ${form.watch("name")}` : "New Service"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border px-3 py-2 bg-white">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                        {field.value ? "Active" : "Inactive"}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Save className="h-4 w-4" />
                            Save Service
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-6">
                        <TabsTrigger
                            value="general"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 relative"
                        >
                            General Info
                            {(form.formState.errors.name || form.formState.errors.slug || form.formState.errors.shortDescription || form.formState.errors.description) && (
                                <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 relative"
                        >
                            Service Options & Designs ({serviceOptions.length})
                            {form.formState.errors.serviceOptions && (
                                <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500" />
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 mt-0">
                        <Card className="border-zinc-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Primary Service Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Managed SD-WAN" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Slug</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. managed-sd-wan" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="shortDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Short Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Brief overview for cards" {...field} />
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
                                            <FormLabel className="flex items-center gap-2">
                                                Detailed Description
                                                <Badge variant="outline" className="text-[10px] font-normal py-0">AI Assistant Available</Badge>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Comprehensive description of the service..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-zinc-200">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Supported Features</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                        <Input
                                            placeholder="Search features..."
                                            className="pl-9 h-9 w-[200px]"
                                            value={featureSearch}
                                            onChange={(e) => setFeatureSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingFeatures ? (
                                    <div className="h-32 flex items-center justify-center text-zinc-500 italic">
                                        Loading features catalog...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 text-left">
                                        {filteredFeatures.map((feature) => (
                                            <FormField
                                                key={feature.id}
                                                control={form.control}
                                                name="features"
                                                render={({ field }) => (
                                                    <FormItem
                                                        key={feature.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(feature.name)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, feature.name])
                                                                        : field.onChange(
                                                                            field.value?.filter((value: string) => value !== feature.name)
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-sm font-medium cursor-pointer">
                                                                {feature.name}
                                                            </FormLabel>
                                                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{feature.service}</p>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-zinc-200">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Caveats (one per line)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="constraints"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Constraints or limitations..."
                                                        className="min-h-[150px] font-mono text-sm"
                                                        value={field.value?.join("\n")}
                                                        onChange={(e) => field.onChange(e.target.value.split("\n").filter(l => l.trim()))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-zinc-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">Assumptions (one per line)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="assumptions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="What is assumed to be true or provided..."
                                                        className="min-h-[150px] font-mono text-sm"
                                                        value={field.value?.join("\n")}
                                                        onChange={(e) => field.onChange(e.target.value.split("\n").filter(l => l.trim()))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="options" className="space-y-6 mt-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-zinc-900">Service Options</h3>
                            <Button
                                type="button"
                                onClick={() => appendServiceOption({
                                    optionId: `option-${Date.now()}`,
                                    name: "New Option",
                                    shortDescription: "",
                                    features: [],
                                    constraints: [],
                                    assumptions: [],
                                    designOptions: []
                                })}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Service Option
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {serviceOptions.map((option, index) => (
                                <ServiceOptionItem
                                    key={option.id}
                                    index={index}
                                    control={form.control}
                                    watch={form.watch}
                                    remove={() => removeServiceOption(index)}
                                    availableFeatures={availableFeatures}
                                />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </form>
        </Form>
    );
}

function ServiceOptionItem({ index, control, watch, remove, availableFeatures }: any) {
    const { fields: designOptionGroups, append: appendGroup, remove: removeGroup } = useFieldArray({
        control,
        name: `serviceOptions.${index}.designOptions`,
    });

    return (
        <Accordion type="single" collapsible className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <AccordionItem value={`item-${index}`} className="border-none">
                <div className="flex items-center justify-between px-6 py-4 bg-white hover:bg-zinc-50/50 transition-colors group">
                    <AccordionTrigger className="flex-1 hover:no-underline py-0">
                        <div className="flex items-center gap-4 text-left">
                            <span className="font-bold text-blue-600">{watch(`serviceOptions.${index}.name`)}</span>
                            <span className="text-zinc-500 text-sm font-normal">— {watch(`serviceOptions.${index}.shortDescription`) || "No description"}</span>
                        </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 ml-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-zinc-900"
                        >
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                remove();
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
                <AccordionContent className="p-6 border-t border-zinc-100 bg-zinc-50/30">
                    <div className="max-w-4xl space-y-8">
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-zinc-900">Configure Service Option</h4>

                            <div className="space-y-4">
                                <FormField
                                    control={control}
                                    name={`serviceOptions.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`serviceOptions.${index}.shortDescription`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Short Description</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`serviceOptions.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Detailed Description</FormLabel>
                                            <FormControl>
                                                <Textarea className="min-h-[100px]" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormLabel>Supported Features</FormLabel>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-white border border-zinc-200 rounded-lg max-h-[300px] overflow-y-auto">
                                    {availableFeatures.map((feature: any) => (
                                        <FormField
                                            key={feature.id}
                                            control={control}
                                            name={`serviceOptions.${index}.features`}
                                            render={({ field }) => (
                                                <div className="flex items-start gap-2 p-2 rounded hover:bg-zinc-50 transition-colors">
                                                    <Checkbox
                                                        checked={field.value?.includes(feature.name)}
                                                        onCheckedChange={(checked) => {
                                                            const current = field.value || [];
                                                            return checked
                                                                ? field.onChange([...current, feature.name])
                                                                : field.onChange(current.filter((x: string) => x !== feature.name))
                                                        }}
                                                    />
                                                    <div className="space-y-0.5 leading-none">
                                                        <span className="text-xs font-medium text-zinc-800">{feature.name}</span>
                                                        <p className="text-[9px] text-zinc-400 font-mono tracking-tight uppercase">{feature.service}</p>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-zinc-900">Nested Design Options</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => appendGroup({ groupId: `group-${Date.now()}`, groupLabel: "New Category", choices: [] })}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Category
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {designOptionGroups.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic">No design categories added yet.</p>
                                ) : (
                                    designOptionGroups.map((group, groupIndex) => (
                                        <div key={group.id} className="p-4 bg-white border border-zinc-200 rounded-lg space-y-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <FormField
                                                    control={control}
                                                    name={`serviceOptions.${index}.designOptions.${groupIndex}.groupLabel`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1 mr-4">
                                                            <FormControl>
                                                                <Input {...field} className="font-bold border-none px-0 h-auto focus-visible:ring-0 text-zinc-900" placeholder="Category Name (e.g. Deployment Mode)" />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                                    onClick={() => removeGroup(groupIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <DesignOptionChoices
                                                serviceIndex={index}
                                                groupIndex={groupIndex}
                                                control={control}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

function DesignOptionChoices({ serviceIndex, groupIndex, control }: any) {
    const { fields: choices, append, remove } = useFieldArray({
        control,
        name: `serviceOptions.${serviceIndex}.designOptions.${groupIndex}.choices`,
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Design Choices</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => append({
                        name: "New Choice",
                        category: "Default",
                        shortDescription: "",
                        description: "",
                        pros: [],
                        cons: [],
                        features: [],
                        constraints: [],
                        assumptions: []
                    })}
                    className="h-7 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Choice
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {choices.map((choice, choiceIndex) => (
                    <div key={choice.id} className="flex flex-col gap-3 p-4 bg-zinc-50/80 rounded-lg border border-zinc-200 group relative">
                        <div className="flex items-center gap-2">
                            <FormField
                                control={control}
                                name={`serviceOptions.${serviceIndex}.designOptions.${groupIndex}.choices.${choiceIndex}.name`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input {...field} className="h-9 py-0 font-medium bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm" placeholder="Choice Name" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => remove(choiceIndex)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={control}
                                name={`serviceOptions.${serviceIndex}.designOptions.${groupIndex}.choices.${choiceIndex}.shortDescription`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-zinc-600">Short Description</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="h-8 py-0 text-sm bg-white" placeholder="Brief description of this choice" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`serviceOptions.${serviceIndex}.designOptions.${groupIndex}.choices.${choiceIndex}.description`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-zinc-600">Detailed Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Comprehensive description of this choice..."
                                                className="min-h-[80px] text-sm bg-white"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`serviceOptions.${serviceIndex}.designOptions.${groupIndex}.choices.${choiceIndex}.constraints`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-zinc-600">Caveats (one per line)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter caveats..."
                                                className="min-h-[80px] text-sm bg-white"
                                                value={field.value?.join("\n") || ""}
                                                onChange={(e) => field.onChange(e.target.value.split("\n").filter(l => l.trim()))}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`serviceOptions.${serviceIndex}.designOptions.${groupIndex}.choices.${choiceIndex}.assumptions`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-zinc-600">Assumptions (one per line)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter assumptions..."
                                                className="min-h-[80px] text-sm bg-white"
                                                value={field.value?.join("\n") || ""}
                                                onChange={(e) => field.onChange(e.target.value.split("\n").filter(l => l.trim()))}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
