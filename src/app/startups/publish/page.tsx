"use client";

import { useState, useEffect } from "react";
import { Briefcase, TrendingUp, Presentation, AlertCircle, Save, Bot, Loader2, Building2, BarChart3, Settings2, ShieldCheck, ShieldAlert, LineChart } from "lucide-react";

export default function PublishStartupPage() {
    const [formData, setFormData] = useState({
        name: "",
        sector: "FinTech",
        businessModel: "B2B SaaS",
        description: "",
        equityForSale: "",
        fundingRequired: "",
        mrr: "",
        netProfitMargin: "",
        cac: "",
        ltv: "",
        projectedROI: "",
        videos: [""],

        // 1. Basic Company Information
        basicInfo: { founderNames: "", incorporationYear: new Date().getFullYear(), companyType: "Private Ltd", location: "", teamSize: 1 },
        // 2. Business Model Details
        businessInfo: { revenueModel: "Subscription", targetMarket: "", uvp: "", competitors: "" },
        // 3. Financial Parameters
        financialsMonthly: { revenue: "", expenses: "", cogs: "", netProfit: 0, grossMargin: 0, netMargin: 0, burnRate: 0, runway: 0 },
        financialsYearly: { annualRevenue: "", annualExpenses: "", ebitda: "", assets: "", liabilities: "", cashInBank: "", debt: "" },
        investmentDetails: { previousFunding: false, previousInvestors: "" },
        // 4. Growth Metrics
        growthMetrics: { mau: "", churnRate: "", conversionRate: "", ordersPerMonth: "", repeatCustomers: "", appDownloads: "" },
        // 5. Operational Metrics
        operationalMetrics: { skus: "", productionCapacity: "", inventoryStatus: "", supplyChain: "", deliveryTime: "", vendorCount: "" },
        // 6. Credibility & Trust Inputs
        credibility: { gstRegistered: false, panVerified: false, aadhaarVerified: false, bankVerified: false, incubatorBacked: false, gstSummaryUrl: "", bankStatementUrl: "", caCertificateUrl: "" },
        // 7. Risk Disclosure Section
        riskDisclosure: { legalCases: false, outstandingLoans: false, criminalRecord: false, revenueFluctuationExplanation: "" },

        // Optional AI Ready Fields (Internal)
        aiReady: { last6MonthsRev: [0, 0, 0, 0, 0, 0], last6MonthsExp: [0, 0, 0, 0, 0, 0], growthRate: 0 }
    });

    const addVideoField = () => {
        setFormData({ ...formData, videos: [...formData.videos, ""] });
    };

    const updateVideoField = (index: number, value: string) => {
        const newVideos = [...formData.videos];
        newVideos[index] = value;
        setFormData({ ...formData, videos: newVideos });
    };

    // Auto-calculations effect (Very Important Feature)
    useEffect(() => {
        const rev = Number(formData.financialsMonthly.revenue) || 0;
        const exp = Number(formData.financialsMonthly.expenses) || 0;
        const cogs = Number(formData.financialsMonthly.cogs) || 0;
        const cash = Number(formData.financialsYearly.cashInBank) || 0;

        const netProfit = rev - exp;
        const grossMargin = rev > 0 ? ((rev - cogs) / rev) * 100 : 0;
        const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
        const burnRate = Math.max(0, exp - rev);
        const runway = burnRate > 0 ? (cash / burnRate) : (cash > 0 ? 999 : 0);

        setFormData(prev => ({
            ...prev,
            financialsMonthly: {
                ...prev.financialsMonthly,
                netProfit,
                grossMargin: Number(grossMargin.toFixed(2)),
                netMargin: Number(netMargin.toFixed(2)),
                burnRate,
                runway: Number(runway.toFixed(1))
            }
        }));
    }, [formData.financialsMonthly.revenue, formData.financialsMonthly.expenses, formData.financialsMonthly.cogs, formData.financialsYearly.cashInBank]);

    const handleNestedChange = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                // @ts-ignore
                ...prev[section],
                [field]: value
            }
        }));
    };

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState<{ errors: string[], warnings: string[] } | null>(null);

    const runAIAudit = () => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const rev = Number(formData.financialsMonthly.revenue);
        const margin = formData.financialsMonthly.netMargin;
        const fundingAsk = Number(formData.fundingRequired);
        const cac = Number(formData.cac);
        const ltv = Number(formData.ltv);
        const runway = formData.financialsMonthly.runway;

        if (margin > 80 || margin < -200) {
            errors.push(`Unrealistic Net Margin (${margin}%). Verify your revenue and expenses.`);
        }

        if (cac > 0 && ltv > 0 && cac >= ltv) {
            errors.push(`Unit Economics inversion detected. Customer Acquisition Cost (₹${cac}) cannot exceed Lifetime Value (₹${ltv}).`);
        }

        if (rev < 1000 && fundingAsk > 10000000) {
            warnings.push("High Valuation Risk: Asking for >₹1Cr funding on less than ₹1k MRR may trigger auto-rejection by the AI Matchmaking system.");
        }

        if (runway > 0 && runway < 3 && fundingAsk === 0) {
            warnings.push("Low Runway Warning: You have less than 3 months runway, consider requesting funding immediately.");
        }

        const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const vimeoRegExp = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i;

        formData.videos.forEach((vid, idx) => {
            if (vid.trim() !== "") {
                const isYt = vid.match(ytRegExp) && vid.match(ytRegExp)![2].length === 11;
                const isVimeo = vid.match(vimeoRegExp);
                if (!isYt && !isVimeo) {
                    errors.push(`Video link #${idx + 1} is not a valid embeddable public YouTube or Vimeo URL.`);
                }
            }
        });

        return { errors, warnings };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setAuditResult(null);
        setIsAuditing(true);

        await new Promise(r => setTimeout(r, 1500));
        const audit = runAIAudit();
        setIsAuditing(false);

        if (audit.errors.length > 0) {
            setAuditResult(audit);
            return;
        }

        if (audit.warnings.length > 0 && !auditResult?.warnings) {
            setAuditResult(audit);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/startups/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // Compatibility overrides map complex auto-calc fields to the original required base fields safely
                    mrr: formData.financialsMonthly.revenue || formData.mrr || 0,
                    netProfitMargin: formData.financialsMonthly.netMargin || formData.netProfitMargin || 0
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to publish startup');
            }
            setSuccess(true);
        } catch (err: any) {
            console.error("Publish error:", err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl min-h-screen">
            <div className="mb-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 text-emerald-600 text-sm font-semibold mb-6 border border-lime-500/20 shadow-[0_0_10px_-2px_rgba(163,230,53,0.3)]">
                    <ShieldCheck className="size-4" /> Professional Startup Data Standard
                </div>
                <h1 className="text-4xl font-outfit font-bold text-slate-900 mb-2">Publish Your Startup</h1>
                <p className="text-slate-500 font-inter">Complete the 7-section verification standard. Our AI relies on accurate financial disclosures to match you with top-tier partners.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm border border-slate-200 bg-white rounded-3xl p-8 lg:p-10 relative overflow-hidden">
                {success ? (
                    <div className="py-20 text-center animate-in zoom-in duration-500">
                        <div className="size-24 bg-emerald-900/40 border border-emerald-500/30 rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]">
                            <Save className="size-12 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 font-outfit mb-4">Profile Verified & Published!</h2>
                        <p className="text-slate-500 max-w-md mx-auto text-lg">Your startup is now live in the investor search engine. We will notify you when an AI match occurs.</p>
                        <button onClick={() => setSuccess(false)} className="mt-10 px-10 py-4 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-colors shadow-[0_0_20px_-5px_rgba(163,230,53,0.4)]">
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-12 relative z-10 text-slate-700">

                        {/* Audit Modal */}
                        {auditResult && (
                            <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Bot className="size-32" />
                                </div>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-emerald-600">
                                    <Bot className="size-5" /> InVolution AI Audit Results
                                </h3>

                                {auditResult.errors.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-red-400 font-bold mb-2 flex items-center gap-1"><AlertCircle className="size-4" /> Critical Flags (Must resolve before publish):</p>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                                            {auditResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {auditResult.warnings.length > 0 && (
                                    <div>
                                        <p className="text-amber-700 font-bold mb-2 flex items-center gap-1"><AlertCircle className="size-4" /> Optimization Warnings:</p>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                                            {auditResult.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                                        </ul>
                                        {auditResult.errors.length === 0 && (
                                            <p className="text-sm font-medium text-slate-500 mt-6 pt-4 border-t border-slate-200">Click "Publish" again to acknowledge these warnings and bypass the AI lock.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {error && !auditResult && (
                            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* SECTION 1: BASIC COMPANY INFORMATION */}
                        <div className="space-y-6 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                                <span className="flex items-center justify-center size-8 rounded-full bg-lime-900/40 text-emerald-600 text-sm border border-lime-500/20">1</span>
                                Basic Company Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-slate-700">Startup Name</label>
                                    <input type="text" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all font-medium" placeholder="e.g. InVolution Core" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Founder Name(s)</label>
                                    <input type="text" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all font-medium" placeholder="Jane Doe, John Smith" value={formData.basicInfo.founderNames} onChange={(e) => handleNestedChange('basicInfo', 'founderNames', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Sector / Industry</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all appearance-none font-medium" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })}>
                                        <option value="FinTech">FinTech</option>
                                        <option value="HealthTech">HealthTech</option>
                                        <option value="EdTech">EdTech</option>
                                        <option value="SaaS">SaaS</option>
                                        <option value="Cleantech">CleanTech</option>
                                        <option value="DeepTech">DeepTech</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Company Type</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all appearance-none font-medium" value={formData.basicInfo.companyType} onChange={(e) => handleNestedChange('basicInfo', 'companyType', e.target.value)}>
                                        <option value="Private Ltd">Private Ltd</option>
                                        <option value="LLP">LLP</option>
                                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                                        <option value="Inc">Inc / Corp</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Year of Incorporation</label>
                                    <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all font-medium" value={formData.basicInfo.incorporationYear} onChange={(e) => handleNestedChange('basicInfo', 'incorporationYear', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Registered Location</label>
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all font-medium" placeholder="Bangalore, India" value={formData.basicInfo.location} onChange={(e) => handleNestedChange('basicInfo', 'location', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Team Size</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all font-medium" value={formData.basicInfo.teamSize} onChange={(e) => handleNestedChange('basicInfo', 'teamSize', Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: BUSINESS MODEL DETAILS */}
                        <div className="space-y-6 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-400"></div>
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                                <span className="flex items-center justify-center size-8 rounded-full bg-indigo-900/40 text-indigo-400 text-sm border border-indigo-500/20">2</span>
                                Business Model Details
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Business Model Type</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none font-medium" value={formData.businessModel} onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}>
                                        <option value="B2B">B2B</option>
                                        <option value="B2C">B2C</option>
                                        <option value="D2C">D2C</option>
                                        <option value="SaaS">SaaS</option>
                                        <option value="Marketplace">Marketplace</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="Commission-based">Commission-based</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Revenue Model</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none font-medium" value={formData.businessInfo.revenueModel} onChange={(e) => handleNestedChange('businessInfo', 'revenueModel', e.target.value)}>
                                        <option value="One-time sales">One-time sales</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="Licensing">Licensing</option>
                                        <option value="Ads">Ads</option>
                                        <option value="Commission">Commission</option>
                                        <option value="Freemium">Freemium</option>
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-slate-700">Target Market</label>
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium" placeholder="e.g. Mid-market healthcare providers in APAC" value={formData.businessInfo.targetMarket} onChange={(e) => handleNestedChange('businessInfo', 'targetMarket', e.target.value)} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-slate-700">Unique Value Proposition (UVP)</label>
                                    <textarea rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium" placeholder="What sets you completely apart..." value={formData.businessInfo.uvp} onChange={(e) => handleNestedChange('businessInfo', 'uvp', e.target.value)} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-slate-700">Pitch Description (System Overview)</label>
                                    <textarea rows={3} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium" placeholder="Provide a high-level summary of operations..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: FINANCIAL PARAMETERS */}
                        <div className="space-y-6 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 size-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>

                            <h3 className="text-xl font-bold flex items-center justify-between text-amber-700 border-b border-slate-200 pb-4">
                                <span className="flex items-center gap-3">
                                    <span className="flex items-center justify-center size-8 rounded-full bg-amber-900/40 text-amber-700 text-sm border border-amber-200">3</span>
                                    Financial Parameters (AI Monitored)
                                </span>
                            </h3>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Monthly Financial Entry (₹)</h4>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Total Revenue / MRR</label>
                                        <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-amber-700 transition-all" placeholder="0" value={formData.financialsMonthly.revenue} onChange={(e) => handleNestedChange('financialsMonthly', 'revenue', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">COGS (Cost of Goods)</label>
                                        <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-slate-800 transition-all" placeholder="0" value={formData.financialsMonthly.cogs} onChange={(e) => handleNestedChange('financialsMonthly', 'cogs', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Total Expenses (Excl. COGS)</label>
                                        <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-slate-800 transition-all" placeholder="0" value={formData.financialsMonthly.expenses} onChange={(e) => handleNestedChange('financialsMonthly', 'expenses', e.target.value)} />
                                    </div>
                                </div>

                                {/* Auto Calculated Display Bar */}
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Net Profit</p>
                                        <p className={`font-mono text-sm font-bold ${formData.financialsMonthly.netProfit >= 0 ? "text-emerald-600" : "text-red-400"}`}>₹{formData.financialsMonthly.netProfit.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Gross Margin</p>
                                        <p className="font-mono text-sm font-bold text-slate-900">{formData.financialsMonthly.grossMargin}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Net Margin</p>
                                        <p className={`font-mono text-sm font-bold ${formData.financialsMonthly.netMargin >= 0 ? "text-emerald-600" : "text-red-400"}`}>{formData.financialsMonthly.netMargin}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Monthly Burn</p>
                                        <p className="font-mono text-sm font-bold text-slate-900">₹{formData.financialsMonthly.burnRate.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Runway</p>
                                        <p className="font-mono text-sm font-bold text-slate-900">{formData.financialsMonthly.runway === 999 ? "∞" : formData.financialsMonthly.runway} mo.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Yearly Posture & Runway</h4>
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Annual Revenue</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-slate-800 transition-all" value={formData.financialsYearly.annualRevenue} onChange={(e) => handleNestedChange('financialsYearly', 'annualRevenue', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">EBITDA</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-slate-800 transition-all" value={formData.financialsYearly.ebitda} onChange={(e) => handleNestedChange('financialsYearly', 'ebitda', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Cash in Bank</label>
                                        <input type="number" className="w-full bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-emerald-600 transition-all" placeholder="Feeds runway calc" value={formData.financialsYearly.cashInBank} onChange={(e) => handleNestedChange('financialsYearly', 'cashInBank', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Total Debt</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 font-mono text-slate-800 transition-all" value={formData.financialsYearly.debt} onChange={(e) => handleNestedChange('financialsYearly', 'debt', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="size-4" /> Deal Fundamentals</h4>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Funding Required (₹)</label>
                                        <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/50 font-mono text-xl text-amber-700 transition-all" placeholder="10000000" value={formData.fundingRequired} onChange={(e) => setFormData({ ...formData, fundingRequired: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Equity Offered (%)</label>
                                        <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/50 font-mono text-xl text-slate-800 transition-all" placeholder="10" value={formData.equityForSale} onChange={(e) => setFormData({ ...formData, equityForSale: e.target.value })} />
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-9000">Implied Valuation</p>
                                            <p className="text-xl font-bold font-mono text-slate-800">
                                                {Number(formData.equityForSale) > 0 && Number(formData.fundingRequired) > 0
                                                    ? `₹${(Number(formData.fundingRequired) / (Number(formData.equityForSale) / 100)).toLocaleString()}`
                                                    : "₹0"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: GROWTH METRICS */}
                        <div className="space-y-6 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-pink-400"></div>
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                                <span className="flex items-center justify-center size-8 rounded-full bg-pink-900/40 text-pink-400 text-sm border border-pink-500/20">4</span>
                                Growth Metrics
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">MAU (Monthly Active Users)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pink-500/50 text-slate-800 transition-all font-medium" value={formData.growthMetrics.mau} onChange={(e) => handleNestedChange('growthMetrics', 'mau', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">CAC (₹)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pink-500/50 text-slate-800 transition-all font-medium" value={formData.cac} onChange={(e) => setFormData({ ...formData, cac: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">LTV (₹)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pink-500/50 text-slate-800 transition-all font-medium" value={formData.ltv} onChange={(e) => setFormData({ ...formData, ltv: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Churn Rate (%)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pink-500/50 text-slate-800 transition-all font-medium" value={formData.growthMetrics.churnRate} onChange={(e) => handleNestedChange('growthMetrics', 'churnRate', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Repeat Customers (%)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pink-500/50 text-slate-800 transition-all font-medium" value={formData.growthMetrics.repeatCustomers} onChange={(e) => handleNestedChange('growthMetrics', 'repeatCustomers', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Projected ROI (%)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pink-500/50 text-slate-800 transition-all font-medium" value={formData.projectedROI} onChange={(e) => setFormData({ ...formData, projectedROI: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: OPERATIONAL METRICS */}
                        <div className="space-y-6 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-teal-400"></div>
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4">
                                <span className="flex items-center justify-center size-8 rounded-full bg-teal-900/40 text-teal-400 text-sm border border-teal-500/20">5</span>
                                Operational Metrics
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Number of SKUs (if applicable)</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-slate-800 transition-all font-medium" value={formData.operationalMetrics.skus} onChange={(e) => handleNestedChange('operationalMetrics', 'skus', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Avg Delivery / Fulfillment Time</label>
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-slate-800 transition-all font-medium" placeholder="e.g. 2 Days" value={formData.operationalMetrics.deliveryTime} onChange={(e) => handleNestedChange('operationalMetrics', 'deliveryTime', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Supply Chain Partners (Count)</label>
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-slate-800 transition-all font-medium" value={formData.operationalMetrics.supplyChain} onChange={(e) => handleNestedChange('operationalMetrics', 'supplyChain', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 6: CREDIBILITY & TRUST */}
                        <div className="space-y-6 bg-blue-900/20 p-6 sm:p-8 rounded-2xl border border-blue-500/30">
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-blue-500/30 pb-4">
                                <span className="flex items-center justify-center size-8 rounded-full bg-blue-900/40 text-blue-400 text-sm border border-blue-500/20">6</span>
                                Credibility & Trust Inputs
                            </h3>
                            <p className="text-sm text-slate-500">Marking these fields as true simulates having provided verified documentation in the Data Room.</p>

                            <div className="grid md:grid-cols-3 gap-4">
                                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="checkbox" className="size-5 accent-blue-500" checked={formData.credibility.gstRegistered} onChange={(e) => handleNestedChange('credibility', 'gstRegistered', e.target.checked)} />
                                    <span className="text-sm font-bold text-slate-700">GST Registered</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="checkbox" className="size-5 accent-blue-500" checked={formData.credibility.panVerified} onChange={(e) => handleNestedChange('credibility', 'panVerified', e.target.checked)} />
                                    <span className="text-sm font-bold text-slate-700">Company PAN Verified</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="checkbox" className="size-5 accent-blue-500" checked={formData.credibility.bankVerified} onChange={(e) => handleNestedChange('credibility', 'bankVerified', e.target.checked)} />
                                    <span className="text-sm font-bold text-slate-700">Bank Account Verified</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="checkbox" className="size-5 accent-blue-500" checked={formData.credibility.incubatorBacked} onChange={(e) => handleNestedChange('credibility', 'incubatorBacked', e.target.checked)} />
                                    <span className="text-sm font-bold text-slate-700">Incubator / VC Backed</span>
                                </label>
                            </div>
                        </div>

                        {/* SECTION 7: RISK DISCLOSURE */}
                        <div className="space-y-6 bg-red-900/10 p-6 sm:p-8 rounded-2xl border border-red-500/20">
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-red-500/20 pb-4">
                                <span className="flex items-center justify-center size-8 rounded-full bg-red-900/40 text-red-500 text-sm border border-red-500/20">7</span>
                                Risk Disclosure Section
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="size-5 accent-red-500" checked={formData.riskDisclosure.legalCases} onChange={(e) => handleNestedChange('riskDisclosure', 'legalCases', e.target.checked)} />
                                        <span className="text-sm font-bold text-red-400">Any Pending Legal Cases?</span>
                                    </div>
                                    <p className="text-xs text-slate-9000 pl-8">Check if there are active litigations against the entity or founders.</p>
                                </label>
                                <label className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="size-5 accent-red-500" checked={formData.riskDisclosure.criminalRecord} onChange={(e) => handleNestedChange('riskDisclosure', 'criminalRecord', e.target.checked)} />
                                        <span className="text-sm font-bold text-red-400">Any Founder Criminal Record?</span>
                                    </div>
                                </label>
                                <div className="space-y-2 col-span-2 mt-2">
                                    <label className="text-sm font-bold text-slate-700">Revenue Fluctuation Explanation (If any extreme drops occurred)</label>
                                    <textarea rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500/50 text-slate-800 transition-all font-medium" placeholder="Optional disclosure..." value={formData.riskDisclosure.revenueFluctuationExplanation} onChange={(e) => handleNestedChange('riskDisclosure', 'revenueFluctuationExplanation', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* PITCH MEDIA GALLERY */}
                        <div className="space-y-6 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-purple-400"></div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400 border-b border-slate-200 pb-4">
                                <Presentation className="size-5" /> Pitch Media Gallery
                            </h3>

                            <div className="space-y-4">
                                <label className="text-sm font-bold block text-slate-700">Unlisted Pitch Video Links (YouTube/Vimeo)</label>
                                {formData.videos.map((vid: string, index: number) => (
                                    <div key={index} className="flex gap-3">
                                        <input type="url"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/50 text-slate-800 transition-all font-medium"
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={vid} onChange={(e) => updateVideoField(index, e.target.value)}
                                        />
                                        {formData.videos.length > 1 && (
                                            <button type="button" onClick={() => {
                                                const newVids = formData.videos.filter((_: string, i: number) => i !== index);
                                                setFormData({ ...formData, videos: newVids });
                                            }}
                                                className="px-4 py-2 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50 border border-red-500/20"
                                            >Remove</button>
                                        )}
                                    </div>
                                ))}

                                <button type="button" onClick={addVideoField} className="text-sm text-purple-400 font-bold hover:text-purple-300 transition-colors">
                                    + Add another video
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 sticky bottom-6 bg-slate-50/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-2xl z-50">
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <ShieldCheck className="size-5 text-emerald-600" /> All data is encrypted and NDA-protected.
                            </div>
                            <button
                                type="submit"
                                disabled={saving || isAuditing}
                                className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_0_20px_-5px_rgba(163,230,53,0.4)]"
                            >
                                {isAuditing ? <><Loader2 className="size-5 animate-spin" /> System Validating...</> : saving ? "Encrypting & Publishing..." : "Publish Verified Profile"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
