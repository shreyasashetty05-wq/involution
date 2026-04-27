"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BrainCircuit, Activity, LineChart, ChevronRight, SlidersHorizontal, ArrowUpDown, ShieldCheck, Building2 } from "lucide-react";


export default function AISearchEngine() {
    const [filters, setFilters] = useState({
        keyword: "",
        sector: "All",
        maxInvestment: 50000000,
        riskAppetite: "All",
        stage: "All",
        minRevenue: 0,
        businessModel: "All",
        minEquity: 0,
        maxBurn: 10000000,
        maxCac: 1000000,
        minLtv: 0,
        minRoi: 0,
        // New Filters
        companyType: "All",
        revenueModel: "All",
        minRunway: 0,
        excludeLegalRisk: false,
        sortBy: "ai_score"
    });

    const [isSearching, setIsSearching] = useState(false);
    const [allStartups, setAllStartups] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Fetch verified startups from MongoDB
    useEffect(() => {
        const fetchStartups = async () => {
            try {
                const res = await fetch('/api/startups');
                const json = await res.json();
                if (json.success) {
                    setAllStartups(json.data);

                    // Initial sort by ai_score
                    const sorted = [...json.data].sort((a, b) => b.score - a.score);
                    setResults(sorted);
                }
            } catch (err) {
                console.error("Failed to load DB startups", err);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchStartups();
    }, []);

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => {
            let filtered = allStartups.filter(s => {
                // Basic Filters
                const searchStr = filters.keyword.toLowerCase();
                const keywordMatch = !searchStr ||
                    s.name.toLowerCase().includes(searchStr) ||
                    s.sector.toLowerCase().includes(searchStr) ||
                    (s.desc && s.desc.toLowerCase().includes(searchStr)) ||
                    (s.businessModel && s.businessModel.toLowerCase().includes(searchStr)) ||
                    (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(searchStr)));

                const sectorMatch = filters.sector === "All" || s.sector === filters.sector;
                const budgetMatch = s.requested <= filters.maxInvestment;
                const riskMatch = filters.riskAppetite === "All" || s.risk === filters.riskAppetite;
                const stageMatch = filters.stage === "All" || (s.stage && s.stage === filters.stage) || true; // fail open for older docs
                const revenueMatch = s.revenue >= filters.minRevenue;

                // Advanced Filters
                const businessModelMatch = filters.businessModel === "All" || s.businessModel === filters.businessModel;
                const equityMatch = s.equity >= filters.minEquity;
                const burnMatch = s.burn <= filters.maxBurn;

                // Deep Financial Filters
                const cacMatch = (s.financials?.cac || 0) <= filters.maxCac;
                const ltvMatch = (s.financials?.ltv || 0) >= filters.minLtv;
                const roiMatch = (s.financials?.roi || 0) >= filters.minRoi;

                // New Professional Structure Filters
                const companyTypeMatch = filters.companyType === "All" || (s.basicInfo?.companyType === filters.companyType);
                const revenueModelMatch = filters.revenueModel === "All" || (s.businessInfo?.revenueModel === filters.revenueModel);
                let sRunway = s.financialsMonthly?.runway || 0;
                if ((s.financialsMonthly?.burnRate || 0) <= 0 && s.revenue > 0) sRunway = 999;
                const runwayMatch = filters.minRunway === 0 || sRunway >= filters.minRunway;
                const legalMatch = !filters.excludeLegalRisk || !(s.riskDisclosure?.legalCases || s.riskDisclosure?.criminalRecord);

                return keywordMatch && sectorMatch && budgetMatch && riskMatch && stageMatch &&
                    revenueMatch && businessModelMatch && equityMatch && burnMatch &&
                    cacMatch && ltvMatch && roiMatch && companyTypeMatch && revenueModelMatch && runwayMatch && legalMatch;
            });

            // Sorting Engine
            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'revenue_desc':
                        return b.revenue - a.revenue;
                    case 'ask_asc':
                        return a.requested - b.requested;
                    case 'equity_desc':
                        return b.equity - a.equity;
                    case 'valuation_asc':
                        const valA = a.requested / (a.equity / 100);
                        const valB = b.requested / (b.equity / 100);
                        return valA - valB;
                    case 'ai_score':
                    default:
                        return b.score - a.score;
                }
            });

            setResults(filtered);
            setIsSearching(false);
        }, 800);
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl min-h-screen">
            <div className="text-center mb-12 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold mb-6 border border-emerald-300">
                    <BrainCircuit className="size-4" /> AI-Powered Matchmaking Active
                </div>
                <h1 className="text-4xl md:text-5xl font-outfit font-bold text-slate-900 mb-4">Discover Your Next Unicorn</h1>
                <p className="text-slate-500 font-inter max-w-2xl mx-auto text-lg">
                    Dive deep into advanced financials, SaaS metrics, and risk profiles to pinpoint the perfect investment opportunity.
                </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">

                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Search className="size-5 text-emerald-600" /> Search</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Keywords</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-9000" />
                                    <input type="text"
                                        placeholder="AI, B2B, solar..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700 placeholder:text-zinc-600"
                                        value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Industry Sector</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                    value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                                >
                                    <option value="All">All Sectors</option>
                                    <option value="FinTech">FinTech</option>
                                    <option value="HealthTech">HealthTech</option>
                                    <option value="CleanTech">CleanTech</option>
                                    <option value="EdTech">EdTech</option>
                                    <option value="SaaS">SaaS</option>
                                    <option value="DeepTech">DeepTech</option>
                                    <option value="D2C">D2C</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Startup Stage</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                    value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                                >
                                    <option value="All">All Stages</option>
                                    <option value="Idea">Idea Stage</option>
                                    <option value="Pre-Seed">Pre-Seed</option>
                                    <option value="Seed">Seed</option>
                                    <option value="Series A">Series A</option>
                                    <option value="Series B+">Series B+</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Business Model</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                    value={filters.businessModel} onChange={(e) => setFilters({ ...filters, businessModel: e.target.value })}
                                >
                                    <option value="All">Any Model</option>
                                    <option value="B2B SaaS">B2B SaaS</option>
                                    <option value="B2C">B2C</option>
                                    <option value="B2B2C">B2B2C</option>
                                    <option value="Marketplace">Marketplace</option>
                                    <option value="Hardware / IoT">Hardware / IoT</option>
                                    <option value="Subscription">Subscription</option>
                                </select>
                            </div>

                            {/* Divider for Advanced Options Toggle */}
                            <div className="pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center justify-between w-full text-sm font-semibold text-emerald-600 hover:text-lime-300 transition-colors"
                                >
                                    <span className="flex items-center gap-2"><SlidersHorizontal className="size-4" /> Advanced Financials</span>
                                    <ChevronRight className={`size-4  transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                                </button>
                            </div>

                            {/* Advanced Financials */}
                            {showAdvanced && (
                                <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Company Type</label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.companyType} onChange={(e) => setFilters({ ...filters, companyType: e.target.value })}
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Private Ltd">Private Ltd</option>
                                            <option value="LLP">LLP</option>
                                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Revenue Model</label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.revenueModel} onChange={(e) => setFilters({ ...filters, revenueModel: e.target.value })}
                                        >
                                            <option value="All">All Models</option>
                                            <option value="Subscription">Subscription</option>
                                            <option value="One-time sales">One-time sales</option>
                                            <option value="Commission">Commission</option>
                                            <option value="Ads">Ads</option>
                                            <option value="Freemium">Freemium</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Max Investment (₹)</label>
                                        <input type="number" step="1000000"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.maxInvestment} onChange={(e) => setFilters({ ...filters, maxInvestment: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Min. Monthly Revenue (₹)</label>
                                        <input type="number" step="50000"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.minRevenue} onChange={(e) => setFilters({ ...filters, minRevenue: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Min. Equity Offered (%)</label>
                                        <input type="number" step="1" max="100" min="0"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.minEquity} onChange={(e) => setFilters({ ...filters, minEquity: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Max Monthly Burn (₹)</label>
                                        <input type="number" step="50000"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.maxBurn} onChange={(e) => setFilters({ ...filters, maxBurn: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-9000">Min Runway (Months)</label>
                                        <input type="number" step="1"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-700"
                                            value={filters.minRunway} onChange={(e) => setFilters({ ...filters, minRunway: Number(e.target.value) })}
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                                        <input type="checkbox" className="size-4 accent-lime-500" checked={filters.excludeLegalRisk} onChange={(e) => setFilters({ ...filters, excludeLegalRisk: e.target.checked })} />
                                        <span className="text-xs font-medium text-slate-500">Exclude Pending Legal Risks</span>
                                    </label>
                                </div>
                            )}

                            <button
                                onClick={handleSearch}
                                className="w-full py-3 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_-5px_rgba(163,230,53,0.4)] flex items-center justify-center gap-2"
                            >
                                {isSearching ? <BrainCircuit className="size-5 animate-pulse" /> : <Search className="size-5" />}
                                {isSearching ? "Processing Data..." : "Apply Filters"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="lg:col-span-3">
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <h3 className="text-xl font-semibold text-slate-800">
                            {results.length} Validated Opportunities
                        </h3>

                        {/* Sorting Dropdown */}
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="size-4 text-slate-9000" />
                            <select
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500 text-slate-700"
                                value={filters.sortBy}
                                onChange={(e) => {
                                    setFilters({ ...filters, sortBy: e.target.value });
                                    // Trigger instant sort
                                    setTimeout(handleSearch, 0);
                                }}
                            >
                                <option value="ai_score">Sort by AI Match Score</option>
                                <option value="revenue_desc">Highest Monthly Revenue</option>
                                <option value="ask_asc">Lowest Asking Amount</option>
                                <option value="equity_desc">Highest Equity Offered</option>
                                <option value="valuation_asc">Lowest Implied Valuation</option>
                            </select>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <div className="py-24 text-center">
                            <Activity className="size-16 text-emerald-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900">Synchronizing with Deal Flow Database...</h3>
                            <p className="text-slate-500">Evaluating multi-metric profiles and financials.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {results.map((startup, idx) => {
                                const impliedValuation = startup.requested / (startup.equity / 100);

                                return (
                                    <div key={startup._id || startup.id}
                                        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6 group hover:border-emerald-400 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 bg-white"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        {/* Score Circular badge */}
                                        <div className="relative size-20 shrink-0 self-center md:self-start">
                                            <svg className="size-full  -rotate-90">
                                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * startup.score) / 100} className="text-emerald-600 transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl font-bold text-slate-900">{startup.score}</span>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Match</span>
                                            </div>
                                        </div>

                                        <div className="grow space-y-3 text-center md:text-left">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                                <h3 className="text-2xl font-bold text-slate-800 font-outfit group-hover:text-emerald-600 transition-colors">{startup.name}</h3>
                                                <span className="px-2.5 py-1 bg-slate-200 border border-slate-300 rounded-md text-xs font-medium text-slate-700">{startup.sector}</span>
                                                {startup.businessModel && <span className="px-2.5 py-1 bg-slate-200 border border-slate-300 text-slate-700 rounded-md text-xs font-medium">{startup.businessModel}</span>}
                                                <span className="px-2.5 py-1 bg-emerald-900/30 border border-emerald-500/30 text-emerald-600 rounded-md text-xs font-medium">{startup.stage || "Seed"}</span>
                                                <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${startup.risk === 'Low' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : startup.risk === 'Medium' ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-500' : 'bg-red-900/30 border-red-500/30 text-red-500'}`}>
                                                    {startup.risk} Risk
                                                </span>

                                                {/* Credibility Badges */}
                                                {(startup.credibility?.gstRegistered || startup.credibility?.panVerified) && (
                                                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-600 rounded-md text-xs font-medium flex items-center gap-1"><ShieldCheck className="size-3" /> Verified</span>
                                                )}
                                                {startup.credibility?.incubatorBacked && (
                                                    <span className="px-2.5 py-1 bg-emerald-900/30 border border-emerald-500/30 text-emerald-600 rounded-md text-xs font-medium flex items-center gap-1"><Building2 className="size-3" /> VC Backed</span>
                                                )}
                                            </div>

                                            <p className="text-slate-500 text-sm line-clamp-2">{startup.desc}</p>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 mt-4">
                                                <div>
                                                    <p className="text-slate-9000 text-xs mb-1">Asking Size</p>
                                                    <p className="text-slate-800 font-semibold text-sm font-mono">₹{(startup.requested / 100000).toFixed(1)}L</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-9000 text-xs mb-1">Equity Offered</p>
                                                    <p className="text-emerald-600 font-semibold text-sm">{startup.equity}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-9000 text-xs mb-1">Implied Valuation</p>
                                                    <p className="text-slate-800 font-semibold text-sm font-mono">₹{(impliedValuation / 10000000).toFixed(2)}Cr</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-9000 text-xs flex items-center gap-1 mb-1 justify-center md:justify-start">
                                                        <LineChart className="size-3 text-emerald-600" /> MRR
                                                    </p>
                                                    <p className="text-emerald-600 font-semibold text-sm font-mono whitespace-nowrap">₹{(startup.revenue / 100000).toFixed(2)}L</p>
                                                </div>
                                            </div>

                                            {/* Financial Micro-metrics row extended */}
                                            <div className="flex flex-wrap gap-4 pt-2 text-xs">
                                                {startup.financialsMonthly?.netMargin !== undefined && <span className={startup.financialsMonthly.netMargin >= 0 ? "text-emerald-600" : "text-red-400"}>Net Margin: <span className="font-mono font-bold">{startup.financialsMonthly.netMargin}%</span></span>}
                                                {startup.financialsMonthly?.runway !== undefined && <span className="text-slate-9000">Runway: <span className="font-mono text-slate-700 font-bold">{startup.financialsMonthly.runway === 999 ? "∞" : startup.financialsMonthly.runway + ' mo'}</span></span>}
                                                {startup.burn > 0 && <span className="text-red-400">Burn: <span className="font-mono">₹{(startup.burn / 1000).toFixed(0)}K/mo</span></span>}
                                                {startup.financials?.cac > 0 && <span className="text-slate-9000">CAC: <span className="font-mono text-slate-700">₹{startup.financials.cac.toLocaleString()}</span></span>}
                                                {startup.financials?.ltv > 0 && <span className="text-slate-9000">LTV: <span className="font-mono text-slate-700">₹{startup.financials.ltv.toLocaleString()}</span></span>}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                            <Link href={`/startups/${startup._id}`} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm w-full md:w-auto justify-center transition-colors shadow-sm">
                                                <ChevronRight className="size-4" /> View Deal
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}

                            {results.length === 0 && (
                                <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                                    <BrainCircuit className="size-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-800">No matching deal flow found.</h3>
                                    <p className="text-slate-9000 mt-2 max-w-sm mx-auto">Try widening your Advanced Financials parameters or searching across all sectors.</p>
                                    <button
                                        onClick={() => setFilters({ ...filters, businessModel: "All", maxBurn: 100000000, maxCac: 10000000, minLtv: 0, minRoi: 0, minEquity: 0, minRevenue: 0, maxInvestment: 500000000, companyType: "All", revenueModel: "All", minRunway: 0, excludeLegalRisk: false })}
                                        className="mt-6 text-sm text-emerald-600 hover:text-lime-300 underline underline-offset-4"
                                    >
                                        Reset Advanced Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
