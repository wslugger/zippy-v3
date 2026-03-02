import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Box } from "lucide-react";

interface PackageCardProps {
    pkg: any;
    projectId: string;
}

export function PackageCard({ pkg, projectId }: PackageCardProps) {
    const serviceCount = pkg.includedServices?.length || 0;

    return (
        <Link href={`/projects/${projectId}/packages/${pkg.slug}`}>
            <Card className="h-full hover:border-blue-300 hover:shadow-md transition-all group border-zinc-200">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight bg-zinc-50 border-zinc-200 text-zinc-600">
                            {pkg.category}
                        </Badge>
                    </div>
                    <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">
                        {pkg.name}
                    </h3>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                    <p className="text-sm text-zinc-500 line-clamp-2">
                        {pkg.shortDescription}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <Box className="w-3 h-3" />
                        <span>{serviceCount} Services Included</span>
                    </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center text-sm font-medium text-blue-600">
                    View Details
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </CardFooter>
            </Card>
        </Link>
    );
}
