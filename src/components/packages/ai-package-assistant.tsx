"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AIRecommendation } from "@/lib/types";
import {
    Sparkles,
    Upload,
    MessageSquare,
    FileText,
    Loader2,
    CheckCircle2,
    XCircle,
    X,
} from "lucide-react";

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "text/markdown",
];
const ACCEPTED_EXT = ".pdf,.xlsx,.xls,.csv,.pptx,.txt,.md";

interface AiPackageAssistantProps {
    projectId: string;
    onRecommendation: (rec: AIRecommendation) => void;
    recommendedPackageId?: string | null;
}

export function AiPackageAssistant({
    projectId,
    onRecommendation,
    recommendedPackageId,
}: AiPackageAssistantProps) {
    const [tab, setTab] = useState<"upload" | "chat">("upload");
    const [files, setFiles] = useState<File[]>([]);
    const [chatText, setChatText] = useState("");
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addFiles = useCallback((incoming: FileList | null) => {
        if (!incoming) return;
        const valid = Array.from(incoming).filter(
            (f) =>
                ACCEPTED_TYPES.includes(f.type) ||
                ACCEPTED_EXT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext))
        );
        setFiles((prev) => {
            const names = new Set(prev.map((f) => f.name));
            return [...prev, ...valid.filter((f) => !names.has(f.name))];
        });
    }, []);

    const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

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
        setRecommendation(null);
        setLoading(true);

        try {
            let response: Response;

            if (tab === "upload" && files.length > 0) {
                const form = new FormData();
                form.append("projectId", projectId);
                if (chatText.trim()) form.append("chatText", chatText);
                files.forEach((f) => form.append("files", f));
                response = await fetch("/api/packages/recommend", { method: "POST", body: form });
            } else {
                response = await fetch("/api/packages/recommend", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId, chatText }),
                });
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error ?? "Unknown error");
            }

            const rec: AIRecommendation = await response.json();
            setRecommendation(rec);
            onRecommendation(rec);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    const canAnalyze =
        !loading &&
        ((tab === "upload" && files.length > 0) || (tab === "chat" && chatText.trim().length > 20));

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">AI Package Assistant</h3>
                        <p className="text-xs text-muted-foreground">
                            Upload requirements or describe your needs — AI will recommend the best package.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                    {(["upload", "chat"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                tab === t
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            data-testid={`ai-tab-${t}`}
                        >
                            {t === "upload" ? (
                                <Upload className="h-3.5 w-3.5" />
                            ) : (
                                <MessageSquare className="h-3.5 w-3.5" />
                            )}
                            {t === "upload" ? "Upload Documents" : "Describe Requirements"}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {tab === "upload" ? (
                    <div className="space-y-3">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("ai-file-input")?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                                dragging
                                    ? "border-primary bg-primary/5 scale-[1.01]"
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                            )}
                        >
                            <input
                                id="ai-file-input"
                                type="file"
                                multiple
                                accept={ACCEPTED_EXT}
                                className="hidden"
                                onChange={(e) => addFiles(e.target.files)}
                            />
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Drop files here or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF, XLSX, CSV, PPTX, TXT, MD — up to 10 MB each
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
                                        <span className="flex-1 truncate text-xs">{f.name}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {(f.size / 1024).toFixed(0)} KB
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                            data-testid={`remove-file-${f.name}`}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Optional extra context */}
                        <Textarea
                            placeholder="Optional: add extra context or notes alongside the documents..."
                            value={chatText}
                            onChange={(e) => setChatText(e.target.value)}
                            rows={2}
                            className="text-sm resize-none"
                        />
                    </div>
                ) : (
                    <Textarea
                        placeholder="Describe your customer's requirements in detail. For example: 'The customer needs a fully managed SD-WAN solution for 50 branch locations, with 24/7 NOC monitoring, advanced security, and must integrate with their existing MPLS network...'"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        rows={6}
                        className="text-sm resize-none"
                    />
                )}

                {/* Analyze button */}
                <div className="flex items-center justify-between gap-4">
                    <Button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        {loading ? "Analyzing..." : "Analyze & Recommend"}
                    </Button>
                    {recommendation && (
                        <span className="text-xs text-muted-foreground">
                            Scroll down to see the highlighted package →
                        </span>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                {/* Result card */}
                {recommendation && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2" data-testid="ai-recommendation-header">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800 text-sm">AI Recommendation Ready</span>
                            <Badge className="ml-auto bg-green-600 text-white text-xs hover:bg-green-600">
                                {recommendation.confidence}% confidence
                            </Badge>
                        </div>

                        {/* Confidence bar */}
                        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-700"
                                style={{ width: `${recommendation.confidence}%` }}
                            />
                        </div>

                        <p className="text-sm text-green-900 leading-relaxed">{recommendation.reasoning}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
