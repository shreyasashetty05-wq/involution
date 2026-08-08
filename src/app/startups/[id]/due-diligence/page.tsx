"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
    BrainCircuit, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
    TrendingUp, Users, DollarSign, Activity, FileSearch,
    ChevronDown, ChevronUp
} from "lucide-react";
import { useFetchReport } from "@/frontend/hooks/useFetchReport";
import { PageLoading, PageError, SubPageHeader, ScoreRing } from "@/frontend/components/StartupSubPageShell";


const COLOR_MAP: Record<string, string> = {
    emerald: "text-emerald-600",
    blue: "text-blue-400",
    yellow: "text-amber-700",
    orange: "text-orange-400",
    red: "text-red-400",
};
const BG_COLOR_MAP: Record<string, string> = {
    emerald: "bg-emerald-900/30 border border-emerald-500/20",
    blue: "bg-blue-900/30 border border-blue-500/20",
    yellow: "bg-amber-100 border border-amber-200",
    orange: "bg-orange-900/30 border border-orange-500/20",
    red: "bg-red-900/30 border border-red-500/20",
};

const SECTION_ICONS: Record<string, ReactElement> = {
    financial: <DollarSign className="size-5" />,
    growth: <TrendingUp className="size-5" />,
    credibility: <Users className="size-5" />,
    risk: <ShieldCheck className="size-5" />,
};

/**
 * Renders the AI due diligence report page for a startup, including overall verdict, key metrics, and expandable section analysis.
 * @example
 * DueDiligencePage()
 * JSX.Element
 * @returns {JSX.Element} The due diligence report page UI.
 */
export default function DueDiligencePage() {
    const params = useParams();
    const id = params?.id as string;
    const { report, startup, loading, error } = useFetchReport(id, "due-diligence");
    const [expandedSection, setExpandedSection] = useState<string | null>(null);


    if (loading) return (
        <PageLoading>
            <BrainCircuit className="size-16 text-indigo-400 animate-pulse mx-auto mb-4" />
            <p className="text-slate-900 text-lg font-bold">AI Due Diligence Engine Running...</p>
            <p className="text-slate-500 text-sm mt-1">Analysing financials, growth metrics, credibility &amp; risk</p>
        </PageLoading>
    );
    if (error) return <PageError message={error} />;
    if (!report || !startup) return <PageError message="Report data is unavailable" />;


    const verdictColor = COLOR_MAP[report.verdict?.color] ?? "text-slate-900";
    const verdictBg = BG_COLOR_MAP[report.verdict?.color] ?? "bg-slate-50 border-slate-200";

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl min-h-screen">
            {/* Header — due-diligence has an extra Verdict badge, so we render it manually */}
            <div className="mb-10">
                <SubPageHeader
                    id={id}
                    badgeIcon={<BrainCircuit className="size-6 text-indigo-400" />}
                    badgeLabel="AI Due Diligence Report"
                    badgeColorClasses="text-indigo-400 bg-indigo-900/30 border-indigo-500/20"
                    startupName={startup?.name}
                    startupSector={`${startup?.sector} · ${startup?.stage} Stage`}
                />
                <div className={`-mt-4 mb-10 w-fit px-6 py-3 rounded-2xl border ${verdictBg} text-center`}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Verdict</p>
                    <p className={`text-xl font-bold ${verdictColor}`}>{report.verdict?.label}</p>
                </div>
            </div>

            {/* Overall Score */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
                <ScoreRing score={report.totalScore} stroke="#6366f1" label={report.totalScore} />
                <div className="grow">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Overall Due Diligence Score</h2>
                    <p className="text-slate-500 mb-4 text-sm">Based on financial health (30%), growth metrics (20%), team & credibility (25%), and risk & legal (25%).</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {report.sections?.map((sec: Record<string, unknown>) => (
                            <div key={String(sec.id)} className="bg-white rounded-xl p-3 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">{String(sec.label)}</p>
                                <div className="flex items-center gap-2">
                                    <div className="grow h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(Number(sec.score) / Number(sec.maxScore)) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-600 shrink-0">{Number(sec.score)}/{Number(sec.maxScore)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "MRR", value: `₹${(report.keyMetrics?.revenue / 100000).toFixed(2)}L` },
                    { label: "Monthly Burn", value: `₹${(report.keyMetrics?.burn / 1000).toFixed(0)}K` },
                    { label: "Runway", value: report.keyMetrics?.runway >= 999 ? "∞" : `${report.keyMetrics?.runway} mo` },
                    { label: "Net Margin", value: `${report.keyMetrics?.netMargin}%` },
                    { label: "MAU", value: report.keyMetrics?.mau > 0 ? report.keyMetrics?.mau.toLocaleString() : "N/A" },
                    { label: "MoM Growth", value: `${report.keyMetrics?.growthRate}%` },
                    { label: "Team Size", value: `${report.keyMetrics?.teamSize} people` },
                    { label: "Equity Ask", value: `${report.keyMetrics?.equity}%` },
                ].map(m => (
                    <div key={m.label} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                        <p className="text-xs text-slate-400 font-bold mb-1">{m.label}</p>
                        <p className="text-lg font-bold font-mono text-slate-800">{m.value}</p>
                    </div>
                ))}
            </div>

            {/* Section Deep Dives */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSearch className="size-5 text-indigo-400" /> Detailed Analysis
                </h2>
                {report.sections?.map((sec: Record<string, unknown>) => {
                    const id = String(sec.id);
                    const pct = Number(sec.maxScore) > 0 ? (Number(sec.score) / Number(sec.maxScore)) * 100 : 0;
                    const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                    const isExpanded = expandedSection === id;

                    return (
                        <div key={id} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden transition-all">
                            {/* Section Header */}
                            <button
                                onClick={() => setExpandedSection(isExpanded ? null : id)}
                                className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                        {SECTION_ICONS[id] ?? <FileSearch className="size-5" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900">{String(sec.label)}</p>
                                        <p className="text-xs text-slate-500 font-medium">{String(sec.summary ?? "")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-mono font-bold text-slate-800">{Number(sec.score)} / {Number(sec.maxScore)}</p>
                                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
                                </div>
                            </button>
                            {/* Section Content */}
                            {isExpanded && (
                                <div className="px-6 pb-6 grid md:grid-cols-2 gap-4 border-t border-slate-200">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-1 mt-4">
                                            <CheckCircle2 className="size-3" /> Strengths
                                        </p>
                                        {Array.isArray(sec.strengths) && sec.strengths.length > 0 ? sec.strengths.map((s: unknown, i: number) => (
                                            <p key={i} className="text-sm font-medium text-slate-600 flex items-start gap-2 mb-2">
                                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" /> {String(s)}
                                            </p>
                                        )) : <p className="text-slate-400 italic text-sm">No strengths identified.</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-1 mt-4">
                                            <AlertTriangle className="size-3" /> Flags
                                        </p>
                                        {Array.isArray(sec.flags) && sec.flags.length > 0 ? sec.flags.map((f: unknown, i: number) => (
                                            <p key={i} className="text-sm font-medium text-slate-600 flex items-start gap-2 mb-2">
                                                <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" /> {String(f)}
                                            </p>
                                        )) : <p className="text-slate-400 italic text-sm">No flags found. ✓</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-xs text-slate-400 font-bold">
                Generated by InVolution AI Engine · {new Date(report.generatedAt).toLocaleString()} · Report is advisory only — not financial advice.
            </div>
        </div>
    );
}
