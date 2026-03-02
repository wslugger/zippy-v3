import { COLLATERAL_TYPE_ICONS } from "@/lib/constants";
import { Link as LinkIcon, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CollateralListProps {
    collateral: any[];
}

export function CollateralList({ collateral }: CollateralListProps) {
    if (!collateral || collateral.length === 0) {
        return (
            <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-lg text-zinc-400 text-sm">
                No collateral available for this package.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collateral.map((item, index) => {
                const Icon = COLLATERAL_TYPE_ICONS[item.type as keyof typeof COLLATERAL_TYPE_ICONS] || LinkIcon;
                return (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                    >
                        <Card className="hover:border-blue-300 hover:bg-blue-50/10 transition-colors border-zinc-200 shadow-none">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 leading-none mb-1">
                                            {item.title}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                            {item.type.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition-colors" />
                            </CardContent>
                        </Card>
                    </a>
                );
            })}
        </div>
    );
}
