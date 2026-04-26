"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import {
    Scale, CheckCircle2, XCircle, MinusCircle, AlertTriangle,
    ShieldAlert, Tag, Info
} from "lucide-react";
import { useFetchReport } from "@/frontend/hooks/useFetchReport";
import { PageLoading, PageError, SubPageHeader, ScoreRing } from "@/frontend/components/StartupSubPageShell";


type StatusType = "compliant" | "non-compliant" | "partial" | "not-applicable";

const STATUS_META: Record<StatusType, { label: string; icon: ReactElement; pillClass: string; rowClass: string }> = {
    "compliant": {
        label: "Compliant",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        pillClass: "bg-emerald-950/40 border-emerald-500/30 text-emerald-600",
        rowClass: "border-slate-200 hover:border-emerald-500/50 bg-white",
    },
    "non-compliant": {
        label: "Non-Compliant",
        icon: <XCircle className="w-4 h-4 text-red-400" />,
        pillClass: "bg-red-950/40 border-red-500/30 text-red-400",
        rowClass: "border-red-500/20 bg-red-950/20 hover:border-red-500/50",
    },
    "partial": {
        label: "Partial",
        icon: <MinusCircle className="w-4 h-4 text-amber-700" />,
        pillClass: "bg-amber-100 border-amber-300 text-amber-700",
        rowClass: "border-amber-200 bg-amber-50 hover:border-amber-400",
    },
    "not-applicable": {
        label: "N/A",
        icon: <MinusCircle className="w-4 h-4 text-slate-400" />,
        pillClass: "bg-slate-200 border-slate-300 text-slate-500",
        rowClass: "border-slate-200 opacity-60 bg-slate-50/30",
    },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
    critical: { label: "Critical", color: "text-red-400" },
    high: { label: "High", color: "text-orange-400" },
    medium: { label: "Medium", color: "text-amber-700" },
    low: { label: "Low", color: "text-slate-400" },
};

export default function CompliancePage() {
    const params = useParams();
    const id = params?.id as string;
    const { report, startup, loading, error } = useFetchReport(id, "compliance");
    const [activeCategory, setActiveCategory] = useState<string>("All");


    if (loading) return (
        <PageLoading>
            <Scale className="w-14 h-14 text-purple-400 animate-pulse mx-auto mb-4" />
            <p className="text-slate-900 font-bold">Legal Compliance Agent Running...</p>
            <p className="text-slate-500 text-sm mt-1">Scanning regulatory requirements</p>
        </PageLoading>
    );
    if (error) return <PageError message={error} />;
    if (!report || !startup) return <PageError message="Report data is unavailable" />;

    const scoreColor =
        report.complianceScore >= 90 ? "#10b981" :
            report.complianceScore >= 70 ? "#3b82f6" :
                report.complianceScore >= 50 ? "#eab308" : "#ef4444";

    const filteredItems = activeCategory === "All"
        ? report.items
        : report.items.filter((item: Record<string, unknown>) => item.category === activeCategory);

    const allCategories = ["All", ...(report.categories ?? [])];

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl min-h-screen">
            <SubPageHeader
                id={id}
                badgeIcon={<Scale className="w-6 h-6 text-purple-400" />}
                badgeLabel="Legal Compliance Agent"
                badgeColorClasses="text-purple-400 bg-purple-900/30 border-purple-500/20"
                startupName={startup?.name}
                startupSector={startup?.sector}
            />

            {/* Score Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-10">
                <ScoreRing score={report.complianceScore} stroke={scoreColor} label={report.complianceScore} />

                <div className="grow text-center md:text-left">
                    <p className="text-3xl font-bold mb-2" style={{ color: scoreColor }}>{report.complianceLabel}</p>
                    <div className="flex flex-wrap gap-4 mb-4 text-sm justify-center md:justify-start">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" /> {report.compliantCount} Compliant
                        </span>
                        {report.criticalIssuesCount > 0 && (
                            <span className="flex items-center gap-1 text-red-400 font-medium">
                                <XCircle className="w-4 h-4" /> {report.criticalIssuesCount} Critical
                            </span>
                        )}
                        {report.highIssuesCount > 0 && (
                            <span className="flex items-center gap-1 text-orange-400 font-medium">
                                <AlertTriangle className="w-4 h-4" /> {report.highIssuesCount} High Priority
                            </span>
                        )}
                    </div>
                    <div className={`p-4 rounded-xl border text-sm flex items-start gap-2 font-medium ${report.criticalIssuesCount > 0
                        ? "bg-red-950/40 border-red-500/30 text-red-400"
                        : report.highIssuesCount > 0
                            ? "bg-amber-100 border-amber-300 text-amber-700"
                            : "bg-emerald-950/40 border-emerald-500/30 text-emerald-600"
                        }`}>
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        {report.investorNote}
                    </div>
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {allCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${activeCategory === cat
                            ? "bg-purple-600 text-white border-purple-500"
                            : "border-slate-200 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-200"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Checklist */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-purple-400" /> Compliance Checklist
                </h2>
                {filteredItems?.map((item: Record<string, unknown>) => {
                    const statusVal = String(item.status || "not-applicable") as StatusType;
                    const meta = STATUS_META[statusVal] ?? STATUS_META["not-applicable"];
                    const pMeta = PRIORITY_META[String(item.priority || "low")] ?? PRIORITY_META.low;
                    return (
                        <div key={String(item.id)} className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-5 transition-all ${meta.rowClass}`}>
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">{meta.icon}</div>
                                <div className="grow">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <p className="font-bold text-slate-800">{String(item.requirement)}</p>
                                        <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded ${meta.pillClass}`}>
                                            {meta.label}
                                        </span>
                                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${pMeta.color}`}>
                                            <Tag className="w-3 h-3" /> {pMeta.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">{String(item.category)}</p>
                                    <p className="text-sm text-slate-500 mt-2">{String(item.detail)}</p>
                                    {item.resolution && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2">
                                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-600 font-medium bg-blue-50/50 p-2 rounded-lg flex-grow border border-blue-100/50">
                                                {String(item.resolution)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 text-center text-xs text-slate-400 font-bold">
                InVolution Legal Compliance Agent · {new Date(report.generatedAt).toLocaleString()} · Based on Indian startup regulations (GST, PMLA, SEBI ICDR, RBI KYC)
            </div>
        </div>
    );
}
