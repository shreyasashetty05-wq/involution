"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { LineChart, FileText, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon, Save, CalendarDays, DollarSign, TrendingUp, History, Clock, Users, Briefcase, Award, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/utils/timeHelper";

const formatCurrency = (val: number | string) => {
    if (!val && val !== 0) return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val));
};

export default function FinancialUpdatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [formData, setFormData] = useState({
        reportingType: "Monthly",
        reportingDate: "",
        revenue: "",
        expenses: "",
        cashInBank: "",
        burnRate: "",
        newCustomers: "",
        totalCustomers: "",
        newPartnerships: "",
        founderUpdate: "",
        gstFiling: "",
        bankStatement: "",
        profitAndLoss: "",
        balanceSheet: "",
        invoiceReport: "",
        salesReport: "",
    });

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

    const revenue = Number(formData.revenue) || 0;
    const expenses = Number(formData.expenses) || 0;
    const profit = revenue - expenses;
    const netLoss = profit < 0 ? Math.abs(profit) : 0;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
    const cashInBank = Number(formData.cashInBank) || 0;
    const burnRate = Number(formData.burnRate) || 0;
    const runway = burnRate > 0 ? Math.round(cashInBank / burnRate) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const res = await fetch(`/api/startups/${id}/financials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    profit: profit,
                    netLoss: netLoss > 0 ? netLoss : null,
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
                <h2 className="text-3xl font-bold font-outfit text-slate-900 mb-4">Financial Update Submitted</h2>
                <p className="text-slate-500 mb-8 text-lg">Your data has been securely saved and is pending admin verification.</p>
                <div className="flex justify-center">
                    <Loader2 className="size-6 text-emerald-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl min-h-[calc(100vh-80px)]">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <Link href="/startups/dashboard" className="text-slate-400 hover:text-emerald-600 text-sm font-semibold mb-4 inline-block transition-colors">&larr; Back to Dashboard</Link>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <LineChart className="size-8 text-emerald-600" /> Post Financial Update
                    </h1>
                    <p className="text-slate-500 font-inter">Share your latest financials to build investor trust and increase visibility.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 font-semibold text-sm shadow-sm">
                    <CheckCircle2 className="size-4" /> AI Powered Verification
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* 1. Reporting Information */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <CalendarDays className="size-5 text-indigo-500" /> 1. Reporting Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Reporting Type <span className="text-red-500">*</span></label>
                            <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800 transition-all font-medium" value={formData.reportingType} onChange={(e) => setFormData({ ...formData, reportingType: e.target.value })}>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Annually">Annually</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Reporting Date <span className="text-red-500">*</span></label>
                            <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800 transition-all font-medium [color-scheme:light]" value={formData.reportingDate} onChange={(e) => setFormData({ ...formData, reportingDate: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* 2. Financial Performance */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <DollarSign className="size-5 text-emerald-500" /> 2. Financial Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Total Revenue (₹) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                <input type="number" min="0" required className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Total Expenses (₹) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                <input type="number" min="0" required className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.expenses} onChange={(e) => setFormData({ ...formData, expenses: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Net Profit / Loss (₹) <span className="text-emerald-500 text-xs font-normal ml-1 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full">Auto</span></label>
                            <div className="relative">
                                <input type="text" readOnly className={`w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold transition-all outline-none ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`} value={formatCurrency(profit)} />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Cash in Bank (₹) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                <input type="number" min="0" required className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.cashInBank} onChange={(e) => setFormData({ ...formData, cashInBank: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Burn Rate (₹ / month) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                <input type="number" min="0" required className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.burnRate} onChange={(e) => setFormData({ ...formData, burnRate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Profit Margin (%)</label>
                            <div className="relative">
                                <input type="text" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-mono text-slate-800 font-bold transition-all outline-none" value={`${profitMargin}%`} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <TrendingUp className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">Calculated Runway</p>
                                <p className="text-sm text-slate-600">Based on Cash in Bank and Burn Rate</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold font-mono text-blue-700">{runway}</span>
                            <span className="text-sm text-blue-600 font-semibold ml-1">Months</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5"><AlertCircle className="size-3.5" /> Net Profit/Loss and Runway are automatically calculated.</p>
                </div>

                {/* 3. Business Performance */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Users className="size-5 text-indigo-500" /> 3. Business Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Users className="size-4 text-indigo-400" /> New Customers</label>
                            <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.newCustomers} onChange={(e) => setFormData({ ...formData, newCustomers: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Users className="size-4 text-indigo-400" /> Total Active Customers</label>
                            <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.totalCustomers} onChange={(e) => setFormData({ ...formData, totalCustomers: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Briefcase className="size-4 text-indigo-400" /> New Partnerships</label>
                            <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-slate-800 transition-all" placeholder="0" value={formData.newPartnerships} onChange={(e) => setFormData({ ...formData, newPartnerships: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Award className="size-4 text-amber-500" /> Major Milestones / Founder Update</label>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-800 transition-all min-h-[100px]" placeholder="Share key updates, achievements, launches, hiring, challenges, or anything important..." value={formData.founderUpdate} onChange={(e) => setFormData({ ...formData, founderUpdate: e.target.value })} />
                    </div>
                </div>

                {/* 4. Supporting Documents */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <FileText className="size-5 text-blue-500" /> 4. Supporting Documents <span className="text-sm font-normal text-slate-500 ml-2">(Provide All Relevant Links)</span>
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Add links to verified documents (Google Drive, Dropbox, etc.) to increase your verification speed and investor trust.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="size-4 text-emerald-500" /> GST Filing</label>
                            <input type="url" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://..." value={formData.gstFiling} onChange={(e) => setFormData({ ...formData, gstFiling: e.target.value })} />
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building2 className="size-4 text-indigo-500" /> Bank Statement</label>
                            <input type="url" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://..." value={formData.bankStatement} onChange={(e) => setFormData({ ...formData, bankStatement: e.target.value })} />
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><LineChart className="size-4 text-pink-500" /> Profit & Loss Statement</label>
                            <input type="url" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://..." value={formData.profitAndLoss} onChange={(e) => setFormData({ ...formData, profitAndLoss: e.target.value })} />
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="size-4 text-amber-500" /> Balance Sheet</label>
                            <input type="url" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://..." value={formData.balanceSheet} onChange={(e) => setFormData({ ...formData, balanceSheet: e.target.value })} />
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="size-4 text-rose-500" /> Invoice Report</label>
                            <input type="url" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://..." value={formData.invoiceReport} onChange={(e) => setFormData({ ...formData, invoiceReport: e.target.value })} />
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><TrendingUp className="size-4 text-emerald-600" /> Sales Report</label>
                            <input type="url" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://..." value={formData.salesReport} onChange={(e) => setFormData({ ...formData, salesReport: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70 text-lg"
                    >
                        {isSaving ? <><Loader2 className="size-5 animate-spin" /> Submitting...</> : "Submit Financial Update"}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="size-3.5" /> Your data is secure and only visible to authorized admins and verified investors.
                    </p>
                </div>
            </form>

            {/* Previous Financial Updates History */}
            <div className="mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <History className="size-5 text-indigo-500" /> Previous Financial Updates
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Track your submitted financial reports and their verification status.</p>
                    </div>
                    <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        View All History <ExternalLink className="size-4" />
                    </button>
                </div>
                
                {history.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                        <History className="size-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No financial history recorded yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                                <tr>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Reporting Type</th>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Date</th>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Revenue (₹)</th>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Expenses (₹)</th>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Net Profit / Loss (₹)</th>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Status</th>
                                    <th className="px-4 py-4 uppercase tracking-wider text-xs">Submitted On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((update, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4 font-semibold text-slate-800">
                                            {update.reportingType}
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 font-medium">
                                            {update.reportingDate || update.monthYear}
                                        </td>
                                        <td className="px-4 py-4 font-mono font-bold text-slate-800">{formatCurrency(update.revenue)}</td>
                                        <td className="px-4 py-4 font-mono font-medium text-slate-600">{formatCurrency(update.expenses)}</td>
                                        <td className={`px-4 py-4 font-mono font-bold ${Number(update.profit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {formatCurrency(update.profit)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                update.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                update.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {update.status === 'Pending' ? 'Under Review' : update.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 text-sm font-medium">
                                            {formatRelativeTime(update.dateSubmitted)}
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
