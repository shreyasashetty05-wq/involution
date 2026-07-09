"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BrainCircuit, Activity, ChevronRight, ArrowUpDown, ShieldCheck, Building2, GraduationCap } from "lucide-react";

/**
 * Displays an investor-facing incubation search page for browsing, filtering, sorting, and viewing verified student startup opportunities.
 * @example
 * IncubeSearch()
 * <IncubeSearch />
 * @returns {JSX.Element} The rendered incubation center search and results page.
 */
export default function IncubeSearch() {
    const [filters, setFilters] = useState({
        keyword: "",
        sector: "All",
        maxInvestment: 50000000,
        riskAppetite: "All",
        stage: "All",
        businessModel: "All",
        minEquity: 0,
        sortBy: "ai_score"
    });

    const [isSearching, setIsSearching] = useState(false);
    const [allStartups, setAllStartups] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Fetch verified student startups from Supabase
    useEffect(() => {
        /**
        * Fetches student-type startup data from the API, stores it in state, and initializes the results sorted by score.
        * @example
        * sync()
        * undefined
        * @returns {Promise<void>} A promise that resolves after the startup data is loaded, sorted, and loading state is updated.
        **/
        const fetchStartups = async () => {
            try {
                const res = await fetch('/api/startups?type=student');
                const json = await res.json();
                if (json.success) {
                    setAllStartups(json.data);

                    // Initial sort by ai_score
                    const sorted = [...json.data].sort((a: any, b: any) => b.score - a.score);
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

    /**
     * Filters and sorts startup investment results based on the current search criteria.
     * @example
     * handleSearch()
     * [{ name: "Startup A" }, { name: "Startup B" }]
     * @returns {void} No return value.
     **/
    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => {
            const filtered = allStartups.filter(s => {
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
                const stageMatch = filters.stage === "All" || (s.stage && s.stage === filters.stage) || true;
                const businessModelMatch = filters.businessModel === "All" || s.businessModel === filters.businessModel;
                const equityMatch = s.equity >= filters.minEquity;

                return keywordMatch && sectorMatch && budgetMatch && riskMatch && stageMatch && businessModelMatch && equityMatch;
            });

            // Sorting Engine
            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'ask_asc':
                        return a.requested - b.requested;
                    case 'equity_desc':
                        return b.equity - a.equity;
                    case 'valuation_asc': {
                        const valA = a.equity > 0 ? a.requested / (a.equity / 100) : Infinity;
                        const valB = b.equity > 0 ? b.requested / (b.equity / 100) : Infinity;
                        return valA - valB;
                    }
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 border border-blue-300">
                    <GraduationCap className="size-4" /> Incubation Center
                </div>
                <h1 className="text-4xl md:text-5xl font-outfit font-bold text-slate-900 mb-4">Discover Student Innovators</h1>
                <p className="text-slate-500 font-inter max-w-2xl mx-auto text-lg">
                    Connect with brilliant minds under 24 and invest in the next generation of groundbreaking ideas before they hit the mainstream.
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
                                        placeholder="AI, Robotics, Solar..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder:text-zinc-600"
                                        value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Industry Sector</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                    value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                                >
                                    <option value="All">All Sectors</option>
                                    <option value="FinTech">FinTech</option>
                                    <option value="HealthTech">HealthTech</option>
                                    <option value="CleanTech">CleanTech</option>
                                    <option value="EdTech">EdTech</option>
                                    <option value="SaaS">SaaS</option>
                                    <option value="DeepTech">DeepTech</option>
                                    <option value="Hardware / IoT">Hardware / IoT</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Startup Stage</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                    value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                                >
                                    <option value="All">All Stages</option>
                                    <option value="Idea">Idea Stage</option>
                                    <option value="Pre-Seed">Pre-Seed</option>
                                    <option value="Seed">Seed</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-9000">Max Investment (₹)</label>
                                <input type="number" step="500000"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                    value={filters.maxInvestment} onChange={(e) => setFilters({ ...filters, maxInvestment: Number(e.target.value) })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-9000">Min. Equity Offered (%)</label>
                                <input type="number" step="1" max="100" min="0"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                    value={filters.minEquity} onChange={(e) => setFilters({ ...filters, minEquity: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {isSearching ? <BrainCircuit className="size-5 animate-pulse" /> : <Search className="size-5" />}
                                {isSearching ? "Processing..." : "Apply Filters"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="lg:col-span-3">
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <h3 className="text-xl font-semibold text-slate-800">
                            {results.length} Student Ideas Found
                        </h3>

                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="size-4 text-slate-9000" />
                            <select
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                                value={filters.sortBy}
                                onChange={(e) => {
                                    setFilters({ ...filters, sortBy: e.target.value });
                                    setTimeout(handleSearch, 0);
                                }}
                            >
                                <option value="ai_score">Sort by AI Match Score</option>
                                <option value="ask_asc">Lowest Asking Amount</option>
                                <option value="equity_desc">Highest Equity Offered</option>
                                <option value="valuation_asc">Lowest Implied Valuation</option>
                            </select>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <div className="py-24 text-center">
                            <Activity className="size-16 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900">Loading Student Startups...</h3>
                            <p className="text-slate-500">Accessing Incubation Center profiles.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {results.map((startup, idx) => {
                                const equityVal = Number(startup.equity) || 0;
                                const impliedValuation = equityVal > 0 ? startup.requested / (equityVal / 100) : 0;

                                return (
                                    <div key={startup._id || startup.id}
                                        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6 group hover:border-blue-400 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className="relative size-20 shrink-0 self-center md:self-start">
                                            <svg className="size-full -rotate-90">
                                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * startup.score) / 100} className="text-blue-500 transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl font-bold text-slate-900">{startup.score}</span>
                                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Match</span>
                                            </div>
                                        </div>

                                        <div className="grow space-y-3 text-center md:text-left">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                                <h3 className="text-2xl font-bold text-slate-800 font-outfit group-hover:text-blue-600 transition-colors">{startup.name}</h3>
                                                <span className="px-2.5 py-1 bg-slate-200 border border-slate-300 rounded-md text-xs font-medium text-slate-700">{startup.sector}</span>
                                                <span className="px-2.5 py-1 bg-blue-900/10 border border-blue-500/30 text-blue-600 rounded-md text-xs font-medium">{startup.stage || "Idea"}</span>
                                            </div>

                                            <p className="text-slate-500 text-sm line-clamp-2">{startup.desc}</p>

                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 mt-4">
                                                <div>
                                                    <p className="text-slate-9000 text-xs mb-1">Ask Rate (Required)</p>
                                                    <p className="text-slate-800 font-semibold text-sm font-mono">₹{(startup.requested / 100000).toFixed(1)}L</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-9000 text-xs mb-1">Equity Offered</p>
                                                    <p className="text-blue-600 font-semibold text-sm">{startup.equity}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-9000 text-xs mb-1">Implied Valuation</p>
                                                    <p className="text-slate-800 font-semibold text-sm font-mono">
                                                        {impliedValuation > 0 ? `₹ ${(impliedValuation / 10000000).toFixed(2)}Cr` : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                            <Link href={`/startups/${startup._id || startup.id}`} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm w-full md:w-auto justify-center transition-colors shadow-sm">
                                                <ChevronRight className="size-4" /> View Deal
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}

                            {results.length === 0 && (
                                <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                                    <GraduationCap className="size-16 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-800">No student ideas found.</h3>
                                    <p className="text-slate-9000 mt-2 max-w-sm mx-auto">Try widening your search parameters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
