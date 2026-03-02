"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ProjectForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const project = await res.json();
                // Redirect directly to package selection as per Phase 4 plan
                router.push(`/projects/${project.id}/packages`);
            } else {
                const error = await res.json();
                alert(`Error: ${JSON.stringify(error)}`);
            }
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-xl mx-auto border-zinc-200">
            <CardHeader>
                <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input
                            id="customerName"
                            placeholder="e.g. Acme Corp"
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Project Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe the scope or requirements..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-zinc-100 pt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue to Package Selection
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
