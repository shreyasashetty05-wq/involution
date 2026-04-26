"use client";

import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, Star, CheckCircle2, XCircle, BadgeCheck, Award, AlertOctagon } from "lucide-react";
import { useFetchReport } from "@/frontend/hooks/useFetchReport";
import { PageLoading, PageError, SubPageHeader, ScoreRing } from "@/frontend/components/StartupSubPageShell";

const TIER_META: Record<string, { icon: ReactElement; color: string; bg: string; border: string }> = {
    Platinum: { icon: <Award className="size-8" />, color: "text-cyan-400", bg: "bg-cyan-950/40", border: "border-cyan-500/30" },
    Gold: { icon: <Star className="size-8" />, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" },
    Silver: { icon: <ShieldCheck className="size-8" />, color: "text-slate-500", bg: "bg-white", border: "border-slate-300/50" },
    Bronze: { icon: <AlertOctagon className="size-8" />, color: "text-orange-400", bg: "bg-orange-950/40", border: "border-orange-500/30" },
};

const COLOR_STROKE: Record<string, string> = {
    emerald: "#10b981", blue: "#3b82f6", yellow: "#eab308", orange: "#f97316", red: "#ef4444"
};

export default function TrustScorePage() {
    const params = useParams();
    const id = params?.id as string;
    const { report, startup, loading, error } = useFetchReport(id, "trust");

    if (loading) return (
        <PageLoading>
            <ShieldCheck className="size-14 text-blue-400 animate-pulse mx-auto mb-4" />
            <p className="text-slate-900 font-bold">Computing Trust &amp; Reputation Score...</p>
        </PageLoading>
    );
    if (error) return <PageError message={error} />;
    if (!report || !startup) return <PageError message="Report data is unavailable" />;

    const tier = report.tier ?? "Bronze";
    const tierMeta = TIER_META[tier] ?? TIER_META.Bronze;
    const stroke = COLOR_STROKE[report.trustColor] ?? "#6366f1";

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-screen">
            <SubPageHeader
                id={id}
                badgeIcon={<ShieldCheck className="size-6 text-blue-400" />}
                badgeLabel="Trust & Reputation Score"
                badgeColorClasses="text-blue-400 bg-blue-900/30 border-blue-500/20"
                startupName={startup?.name}
                startupSector={startup?.sector}
            />

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-10">
                <ScoreRing score={report.totalTrust} stroke={stroke} label={report.totalTrust} />
                <div className="text-center md:text-left">
                    <p className="text-4xl font-bold mb-2" style={{ color: stroke }}>{report.trustLabel}</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-4 ${tierMeta.bg} ${tierMeta.border} ${tierMeta.color} shadow-lg shadow-black/20`}>
                        {tierMeta.icon}
                        <span className="font-bold text-lg">{tier} Tier</span>
                    </div>
                    <p className="text-slate-500 text-sm max-w-sm">
                        <span className="font-bold text-slate-600">{report.verifiedCount}</span> of <span className="font-bold text-slate-600">{report.totalFactors}</span> trust factors verified.
                        Based on identity credentials, financial transparency, external backing, and disclosure integrity.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BadgeCheck className="size-5 text-blue-400" /> Trust Factor Breakdown
                </h2>
                {report.factors?.map((f: Record<string, unknown>) => {
                    const max = Number(f.max) || 0;
                    const earned = Number(f.earned) || 0;
                    const label = String(f.label);
                    const detail = String(f.detail);
                    const pct = max > 0 ? (earned / max) * 100 : 0;
                    const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-amber-500" : "bg-red-500";
                    return (
                        <div key={label} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {f.verified ? <CheckCircle2 className="size-5 text-emerald-600 shrink-0" /> : <XCircle className="size-5 text-red-500 shrink-0" />}
                                    <span className="font-bold text-slate-800">{label}</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-slate-500">{earned} / {max} pts</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">{detail}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 text-center text-xs text-slate-400 font-bold">
                InVolution Trust Engine · {new Date(report.generatedAt).toLocaleString()} · Trust scores are computed from KYC &amp; self-disclosed startup data.
            </div>
        </div>
    );
}
