"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Save, RotateCcw, Info, Zap } from "lucide-react";
import type { AIPrompt } from "@/lib/types";
const GEMINI_MODELS = [
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview - Recommended)" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-flash-latest", label: "Gemini Flash (Latest Alias)" },
];

const TEMPLATE_VARIABLES: Record<string, { label: string; color: string }> = {
    "{packageSummaries}": { label: "List of packages", color: "text-sky-600" },
    "{requirementsTextSection}": { label: "Formatted requirements", color: "text-violet-600" },
    "{siteTypesContext}": { label: "Catalog of site types", color: "text-emerald-600" },
    "{sitesToClassify}": { label: "Raw site data from CSV", color: "text-amber-600" },
    "{payloadJSON}": { label: "Full HLD input payload", color: "text-rose-600" },
    "{customerName}": { label: "Project customer", color: "text-indigo-600" },
};

// Stubs for future tabs
const PROMPT_TABS = [
    { slug: "package_selection", label: "Package Selection" },
    { slug: "recommended_design", label: "Recommended Design", stub: true },
    { slug: "package_chat", label: "Package Chat (Consultant)", stub: true },
    { slug: "hld_generation", label: "HLD Generation", stub: true },
    { slug: "bom_logic_rules", label: "BOM Logic Rules", stub: true },
];

export function PromptsForm() {
    const [activeTab, setActiveTab] = useState("package_selection");
    const [prompt, setPrompt] = useState<AIPrompt | null>(null);
    const [form, setForm] = useState({
        model: "gemini-3-flash-preview",
        temperature: 0.1,
        systemInstruction: "",
        userPromptTemplate: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (PROMPT_TABS.find((t) => t.slug === activeTab)?.stub) {
            setLoading(false);
            setPrompt(null);
            return;
        }
        setLoading(true);
        setError(null);
        fetch(`/api/settings/prompts/${activeTab}`)
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                setPrompt(data);
                setForm({
                    model: data.model ?? "gemini-3-flash-preview",
                    temperature: parseFloat(data.temperature ?? 0.1),
                    systemInstruction: data.systemInstruction ?? "",
                    userPromptTemplate: data.userPromptTemplate ?? "",
                });
            })
            .catch(() => setError("Failed to load prompt. It may not be seeded yet."))
            .finally(() => setLoading(false));
    }, [activeTab]);

    async function handleSave() {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch(`/api/settings/prompts/${activeTab}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Save failed");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setError("Failed to save prompt changes");
        } finally {
            setSaving(false);
        }
    }

    function handleReset() {
        if (!prompt) return;
        setForm({
            model: prompt.model,
            temperature: prompt.temperature,
            systemInstruction: prompt.systemInstruction,
            userPromptTemplate: prompt.userPromptTemplate,
        });
    }

    const isStub = PROMPT_TABS.find((t) => t.slug === activeTab)?.stub;

    return (
        <div className="space-y-6">
            <Card>
                {/* Tabs */}
                <div className="border-b px-6 pt-4">
                    <div className="flex gap-0 overflow-x-auto">
                        {PROMPT_TABS.map((tab) => (
                            <button
                                key={tab.slug}
                                onClick={() => !tab.stub && setActiveTab(tab.slug)}
                                className={cn(
                                    "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                                    activeTab === tab.slug
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground",
                                    tab.stub
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:text-foreground hover:border-muted-foreground/30"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <CardContent className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : isStub ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                            <Info className="h-6 w-6" />
                            <p>This prompt will be configured in a future phase.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Model + Strategy row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Model selector */}
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                            AI Model
                                        </Label>
                                        <Select
                                            value={form.model}
                                            onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GEMINI_MODELS.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Select the Gemini model to power this step.
                                        </p>
                                    </div>

                                    {/* Temperature */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                Temperature
                                            </Label>
                                            <span className="text-primary font-semibold text-sm tabular-nums">
                                                {(form.temperature ?? 0.1).toFixed(1)}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            value={form.temperature}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))
                                            }
                                            className="w-full h-1.5 accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Precise (0.0)</span>
                                            <span>Creative (1.0)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Prompt Strategy info */}
                                <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
                                    <p className="text-sm font-semibold text-primary">Prompt Strategy</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Analyzes customer requirements and suggests the best initial package.
                                    </p>
                                    <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                                        <Info className="h-3.5 w-3.5" />
                                        Use <code className="bg-muted px-1 rounded text-[10px]">{"{variables}"}</code>{" "}
                                        to inject dynamic context.
                                    </div>
                                </div>
                            </div>

                            {/* System Instruction */}
                            <div className="space-y-2">
                                <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    System Instruction
                                </Label>
                                <Textarea
                                    value={form.systemInstruction}
                                    onChange={(e) => setForm((f) => ({ ...f, systemInstruction: e.target.value }))}
                                    rows={3}
                                    className="font-mono text-sm resize-none"
                                    placeholder="You are a Solutions Architect expert."
                                />
                            </div>

                            {/* User Prompt Template */}
                            <div className="space-y-2">
                                <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    User Prompt Template
                                </Label>
                                <Textarea
                                    value={form.userPromptTemplate}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, userPromptTemplate: e.target.value }))
                                    }
                                    rows={12}
                                    className="font-mono text-sm resize-none"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            {/* Footer actions */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <button
                                    onClick={handleReset}
                                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Reset to Default
                                </button>

                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {saved ? "Saved!" : "Save Prompt Changes"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Templating Guide */}
            <div className="rounded-xl bg-zinc-900 p-6 text-zinc-300">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-zinc-100">Templating Guide</p>
                        <p className="text-xs text-zinc-400">
                            The following variables are available depending on the prompt stage. Ensure you
                            include them in your templates if they are critical for the LLM to function.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 mt-4">
                    {Object.entries(TEMPLATE_VARIABLES).map(([variable, info]) => (
                        <div key={variable} className="flex items-baseline gap-2 text-xs">
                            <code className={cn("font-mono", info.color)}>{variable}</code>
                            <span className="text-zinc-500">→ {info.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
