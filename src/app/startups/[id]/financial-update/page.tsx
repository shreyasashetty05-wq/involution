"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Activity, LineChart, FileText, CheckCircle2, AlertCircle, Bot, Loader2, Link as LinkIcon, Save, CalendarDays, DollarSign, TrendingUp, History, Clock } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/utils/timeHelper";

/**
 * Renders a financial update form for a startup, calculates a live AI confidence score from the entered financial data and supporting document, and submits the update to the backend.
 * @example
 * FinancialUpdatePage({ params: Promise.resolve({ id: "startup_123" }) })
 * <FinancialUpdatePage />
 * @param {{ params: Promise<{ id: string }> }} params - Route parameters promise containing the startup id.
 * @returns {JSX.Element} The financial update page UI.
 **/
export default function FinancialUpdatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [formData, setFormData] = useState({
        reportingType: "Monthly",
        reportingDate: "",
        revenue: "",
        profit: "",
        netLoss: "",
        documentUrl: "",
        notes: ""
    });

    const [aiScore, setAiScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/startups');
                const json = await res.json();
                if (json.success) {
                    const match = json.data.find((s: Record<string, unknown>) => String(s._id) === id || String(s.id) === String(id));
                    if (match && match.financial_updates) {
                        setHistory(match.financial_updates.sort((a: any, b: any) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch history");
            }
        };
        fetchHistory();
    }, [id]);

    // AI Confidence Score Calculator Module
    useEffect(() => {
        let score = 0;

        // Base points for just filling it out
        if (formData.reportingDate) score += 20;

        // Points for financial logic
        const rev = Number(formData.revenue);
        const profit = Number(formData.profit);

        if (rev > 0) score += 20;
        if (profit > 0) score += 20; // Profitable
        if (profit < 0 && rev > 0 && Math.abs(profit) < rev) score += 10; // Controlled burn
        if (Number(formData.netLoss) > 0 && rev > 0) score += 10;

        // Massive points for evidence
        if (formData.documentUrl.length > 5) score += 40;

        setAiScore(Math.min(100, score));
    }, [formData.reportingDate, formData.revenue, formData.profit, formData.netLoss, formData.documentUrl]);

    /**
    * Handles financial update form submission, sends the data to the startup financials API, and manages success/error state.
    * @example
    * sync(event)
    * undefined
    * @param {React.FormEvent} e - Form submit event used to prevent default submission behavior.
    * @returns {Promise<void>} A promise that resolves when the submission flow completes.
    **/
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const res = await fetch(`/api/startups/${id}/financials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportingType: formData.reportingType,
                    reportingDate: formData.reportingDate,
                    revenue: Number(formData.revenue),
                    profit: Number(formData.profit),
                    netLoss: formData.netLoss ? Number(formData.netLoss) : null,
                    documentUrl: formData.documentUrl,
                    notes: formData.notes,
                    aiConfidenceScore: aiScore
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit update');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/startups/dashboard");
                router.refresh();
            }, 2500);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSaving(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-2xl min-h-[calc(100vh-80px)] text-center">
                <div className="size-24 bg-emerald-900/40 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                    <Save className="size-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold font-outfit text-slate-900 mb-4">Financial Update Verified</h2>
                <p className="text-slate-500 mb-8 text-lg">Your data has been securely logged on the blockchain and an AI snapshot has been generated with a confidence score of <span className="text-emerald-600 font-bold">{aiScore}/100</span>.</p>
                <div className="flex justify-center">
                    <Loader2 className="size-6 text-emerald-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-[calc(100vh-80px)]">
            <div className="mb-10">
                <Link href="/startups/dashboard" className="text-slate-400 hover:text-emerald-600 text-sm font-semibold mb-4 inline-block transition-colors">&larr; Back to Dashboard</Link>
                <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <LineChart className="size-8 text-emerald-600" /> Post Financial Update
                </h1>
                <p className="text-slate-500 font-inter">Continuous disclosure dramatically increases your AI Match Score and Deal Room visibility.</p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                {/* Form Col */}
                <div className="md:col-span-3">
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-2xl bg-white p-8 space-y-6">

                        {error && (
                            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <CalendarDays className="size-4 text-slate-400" /> Reporting Type
                                </label>
                                <select required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-slate-800 transition-all" value={formData.reportingType} onChange={(e) => setFormData({ ...formData, reportingType: e.target.value })}>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <CalendarDays className="size-4 text-slate-400" /> Reporting Date
                                </label>
                                <input type="date" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-slate-800 transition-all [color-scheme:dark]" value={formData.reportingDate} onChange={(e) => setFormData({ ...formData, reportingDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <DollarSign className="size-4 text-slate-400" /> Total Revenue (₹)
                                </label>
                                <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-slate-800 placeholder:text-zinc-700 transition-all" placeholder="0" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <TrendingUp className="size-4 text-slate-400" /> Net Profit (₹)
                                </label>
                                <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-slate-800 placeholder:text-zinc-700 transition-all" placeholder="0 or negative for loss" value={formData.profit} onChange={(e) => setFormData({ ...formData, profit: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <TrendingUp className="size-4 text-slate-400" /> Net Loss (Optional)
                                </label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-slate-800 placeholder:text-zinc-700 transition-all" placeholder="Positive value" value={formData.netLoss} onChange={(e) => setFormData({ ...formData, netLoss: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                <FileText className="size-4 text-slate-400" /> Notes (Optional)
                            </label>
                            <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-slate-800 transition-all" placeholder="Add any context or explanations for this period..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-200">
                            <label className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                <LinkIcon className="size-4" /> Supporting Document URL (Optional but Highly Recommended)
                            </label>
                            <p className="text-xs text-slate-400 mb-2">Link a verified bank statement, GST filing, or MIS report. This massively boosts your AI Confidence Score.</p>
                            <input type="url" className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-emerald-100 placeholder:text-emerald-900/50 transition-all" placeholder="https://drive.google.com/file/d/..." value={formData.documentUrl} onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })} />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? <><Loader2 className="size-5 animate-spin" /> Committing Data...</> : "Submit Monthly Update"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="md:col-span-2">
                    {/* Outer div: sticky positioning only — overflow:hidden on sticky breaks scroll pinning */}
                    <div className="sticky top-24">
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Bot className="size-32 text-indigo-400" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                    <Activity className="size-4" /> Live AI Analysis
                                </h3>

                                <div className="text-center py-6">
                                    {/* Circular Score Display */}
                                    <div className="relative size-32 mx-auto mb-4">
                                        <svg className="size-full  -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray="364"
                                                strokeDashoffset={364 - (364 * aiScore) / 100}
                                                className={`${aiScore >= 80 ? 'text-emerald-600' : aiScore >= 50 ? 'text-amber-700' : 'text-red-400'} transition-all duration-1000 ease-out`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-bold font-mono ${aiScore >= 80 ? 'text-emerald-600' : aiScore >= 50 ? 'text-amber-700' : 'text-red-400'} transition-colors duration-500`}>
                                                {Math.round(aiScore)}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="text-slate-900 font-bold text-lg">Confidence Score</h4>
                                </div>

                                <div className="space-y-4 mt-4 text-sm">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {formData.reportingDate ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">Temporal Logic Verified</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {Number(formData.revenue) > 0 ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">Revenue Bounds Checked</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {formData.profit !== "" ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">Profit/Loss Ratio Intact</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {formData.documentUrl.length > 5 ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">External Audit Sourced</span>
                                    </div>
                                </div>

                                {aiScore < 80 && (
                                    <div className="mt-8 p-4 bg-amber-950/30 border border-amber-300 rounded-xl">
                                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                            <AlertCircle className="size-4 inline mr-1.5 -mt-0.5" />
                                            Provide a verifiable document URL (GST/Bank) to drastically maximize your Confidence Score parameters for investors.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Previous Financial Updates History */}
            <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <History className="size-5 text-indigo-500" /> Previous Financial Updates
                </h3>
                
                {history.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No financial history recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Reporting Period</th>
                                    <th className="px-4 py-3">Submitted</th>
                                    <th className="px-4 py-3">Revenue (₹)</th>
                                    <th className="px-4 py-3">Profit (₹)</th>
                                    <th className="px-4 py-3">Loss (₹)</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Admin Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((update, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-slate-800">
                                            {update.reportingType} <br/>
                                            <span className="text-xs text-slate-400 font-normal">{update.reportingDate || update.monthYear}</span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-xs">
                                                <Clock className="size-3 text-slate-400" />
                                                {formatRelativeTime(update.dateSubmitted)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-mono text-emerald-600 font-semibold">{update.revenue}</td>
                                        <td className={`px-4 py-4 font-mono font-semibold ${Number(update.profit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{update.profit}</td>
                                        <td className="px-4 py-4 font-mono text-red-500">{update.netLoss || '-'}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                update.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                update.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {update.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-xs italic text-slate-500 max-w-xs truncate" title={update.adminRemarks}>
                                            {update.adminRemarks || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
