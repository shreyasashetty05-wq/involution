/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BrainCircuit, Activity, LineChart, ChevronRight, SlidersHorizontal, ArrowUpDown, ShieldCheck, Building2, Users, CheckCircle2, Bookmark, Share2, Rss, Clock, MapPin, TrendingUp, AlertTriangle, HeartPulse, Factory, Briefcase, Scale, Bell, X, Copy, Mail, MessageCircle, Linkedin, FileText } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";

export default function AISearchEngine() {
    const [filters, setFilters] = useState({
        keyword: "",
        sector: "All",
        maxInvestment: 50000000,
        riskAppetite: "All",
        stage: "All",
        minRevenue: 0,
        businessModel: "All",
        financialStatus: "All",
        minTrustScore: 0,
        minBusinessHealth: 0,
        location: "All",
        
        // Advanced
        minEquity: 0,
        maxBurn: 10000000,
        maxCac: 1000000,
        minLtv: 0,
        minRoi: 0,
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

    // New Interaction States
    const [savedStartups, setSavedStartups] = useState<string[]>([]);
    const [followedStartups, setFollowedStartups] = useState<string[]>([]);
    const [compareList, setCompareList] = useState<string[]>([]);
    const [shareModalData, setShareModalData] = useState<any>(null);

    useEffect(() => {
        // Load interactive states from local storage
        try {
            const s = localStorage.getItem('inv_saved_startups');
            if (s) setSavedStartups(JSON.parse(s));
            const f = localStorage.getItem('inv_followed_startups');
            if (f) setFollowedStartups(JSON.parse(f));
            const c = localStorage.getItem('inv_compare_list');
            if (c) setCompareList(JSON.parse(c));
        } catch (e) {
            console.error(e);
        }

        const fetchStartups = async () => {
            try {
                const res = await fetch('/api/startups?type=regular');
                const json = await res.json();
                if (json.success) {
                    setAllStartups(json.data);
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

    const toggleSave = (id: string) => {
        const isSaving = !savedStartups.includes(id);
        const next = isSaving ? [...savedStartups, id] : savedStartups.filter(x => x !== id);
        setSavedStartups(next);
        localStorage.setItem('inv_saved_startups', JSON.stringify(next));
        
        fetch(`/api/startups/${id}/metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', delta: isSaving ? 1 : -1 })
        }).catch(console.error);
    };

    const toggleFollow = (id: string) => {
        const isFollowing = !followedStartups.includes(id);
        const next = isFollowing ? [...followedStartups, id] : followedStartups.filter(x => x !== id);
        setFollowedStartups(next);
        localStorage.setItem('inv_followed_startups', JSON.stringify(next));

        fetch(`/api/startups/${id}/metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'follow', delta: isFollowing ? 1 : -1 })
        }).catch(console.error);
    };

    const toggleCompare = (id: string) => {
        if (compareList.includes(id)) {
            const next = compareList.filter(x => x !== id);
            setCompareList(next);
            localStorage.setItem('inv_compare_list', JSON.stringify(next));
        } else {
            if (compareList.length >= 3) return; // max 3
            const next = [...compareList, id];
            setCompareList(next);
            localStorage.setItem('inv_compare_list', JSON.stringify(next));
        }
    };

    const getApprovedUpdates = (s: any) => s.financial_updates?.filter((u: any) => u.status === 'Approved').sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()) || [];

    const getGrowth = (s: any) => {
        const updates = getApprovedUpdates(s);
        if (updates.length >= 2) {
            const last = updates[updates.length - 1];
            const prev = updates[updates.length - 2];
            if (Number(prev.revenue) > 0) return ((Number(last.revenue) - Number(prev.revenue)) / Number(prev.revenue)) * 100;
        }
        return 0;
    };

    const getTrust = (s: any) => s.trustScore || 85;

    const calculateHealth = (s: any) => {
        let healthScore = 65;
        const updates = getApprovedUpdates(s);
        if (updates.length > 0) healthScore += 15;
        if (getGrowth(s) > 0) healthScore += 10;
        if (s.credibility?.gstRegistered) healthScore += 5;
        if (s.score > 80) healthScore += 5;
        return Math.min(100, healthScore);
    };

    const getHealthStatus = (score: number) => {
        if (score >= 90) return { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" };
        if (score >= 75) return { text: "Good", color: "text-blue-600", bg: "bg-blue-50" };
        if (score >= 60) return { text: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50" };
        return { text: "Needs Attention", color: "text-red-600", bg: "bg-red-50" };
    };

    const getLatestUpdateMs = (s: any) => {
        const updates = getApprovedUpdates(s);
        if (updates.length > 0) return new Date(updates[updates.length - 1].dateSubmitted).getTime();
        return new Date(s.createdAt || 0).getTime();
    };

    const formatCurrency = (val: number) => {
        if (val === undefined || val === null || val === 0) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Crore`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
        return `₹${val.toLocaleString()}`;
    };

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
                const revenueMatch = s.revenue >= filters.minRevenue;
                const businessModelMatch = filters.businessModel === "All" || s.businessModel === filters.businessModel;
                
                const finStatusMatch = filters.financialStatus === "All" || 
                    (filters.financialStatus === "Verified" && getApprovedUpdates(s).length > 0) ||
                    (filters.financialStatus === "Pending" && getApprovedUpdates(s).length === 0);
                const trustMatch = getTrust(s) >= filters.minTrustScore;
                const healthMatch = calculateHealth(s) >= filters.minBusinessHealth;
                const locationMatch = filters.location === "All" || s.location === filters.location;

                // Advanced Filters
                const equityMatch = s.equity >= filters.minEquity;
                const burnMatch = s.burn <= filters.maxBurn;
                const cacMatch = (s.financials?.cac || 0) <= filters.maxCac;
                const ltvMatch = (s.financials?.ltv || 0) >= filters.minLtv;
                const roiMatch = (s.financials?.roi || 0) >= filters.minRoi;
                const companyTypeMatch = filters.companyType === "All" || (s.basicInfo?.companyType === filters.companyType);
                const revenueModelMatch = filters.revenueModel === "All" || (s.businessInfo?.revenueModel === filters.revenueModel);
                
                let sRunway = s.financialsMonthly?.runway || 0;
                if ((s.financialsMonthly?.burnRate || 0) <= 0 && s.revenue > 0) sRunway = 999;
                const runwayMatch = filters.minRunway === 0 || sRunway >= filters.minRunway;
                const legalMatch = !filters.excludeLegalRisk || !(s.riskDisclosure?.legalCases || s.riskDisclosure?.criminalRecord);

                return keywordMatch && sectorMatch && budgetMatch && riskMatch && stageMatch &&
                    revenueMatch && businessModelMatch && finStatusMatch && trustMatch && healthMatch && locationMatch &&
                    equityMatch && burnMatch && cacMatch && ltvMatch && roiMatch && companyTypeMatch && revenueModelMatch && runwayMatch && legalMatch;
            });

            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'revenue_desc':
                        return b.revenue - a.revenue;
                    case 'growth_desc':
                        return getGrowth(b) - getGrowth(a);
                    case 'trust_desc':
                        return getTrust(b) - getTrust(a);
                    case 'updated_desc':
                        return getLatestUpdateMs(b) - getLatestUpdateMs(a);
                    case 'newest':
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                    case 'active_desc':
                        return getApprovedUpdates(b).length - getApprovedUpdates(a).length;
                    case 'ai_score':
                    default:
                        return b.score - a.score;
                }
            });

            setResults(filtered);
            setIsSearching(false);
        }, 600);
    };

    const generateMiniSparkline = (data: number[]) => {
        if (!data || data.length < 2) return null;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max === min ? 1 : max - min;
        return data.map((val, i) => {
            const x = (i / (data.length - 1)) * 40;
            const y = 20 - ((val - min) / range) * 20;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl min-h-screen bg-slate-50/30">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold mb-6 border border-emerald-200 shadow-sm">
                    <BrainCircuit className="size-4" /> AI-Powered Matchmaking Active
                </div>
                <h1 className="text-4xl md:text-5xl font-outfit font-bold text-slate-900 mb-4">Discover Your Next Unicorn</h1>
                <p className="text-slate-500 font-inter max-w-2xl mx-auto text-lg">
                    Dive deep into advanced financials, SaaS metrics, and verified profiles to pinpoint the perfect investment opportunity.
                </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><SlidersHorizontal className="size-5 text-emerald-600" /> Filters</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Keywords</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <input type="text"
                                        placeholder="AI, B2B, solar..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400 transition-shadow"
                                        value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Industry</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-shadow"
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
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Startup Stage</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-shadow"
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
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Model</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-shadow"
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

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Status</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-shadow"
                                    value={filters.financialStatus} onChange={(e) => setFilters({ ...filters, financialStatus: e.target.value })}
                                >
                                    <option value="All">All Startups</option>
                                    <option value="Verified">Financially Verified Only</option>
                                    <option value="Pending">Unverified Only</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center justify-between w-full text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    <span>Advanced Filters</span>
                                    <ChevronRight className={`size-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                                </button>
                            </div>

                            {/* Advanced Financials */}
                            {showAdvanced && (
                                <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Max Funding Range (₹)</label>
                                        <input type="number" step="1000000"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                                            value={filters.maxInvestment} onChange={(e) => setFilters({ ...filters, maxInvestment: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Min. Monthly Revenue (₹)</label>
                                        <input type="number" step="50000"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                                            value={filters.minRevenue} onChange={(e) => setFilters({ ...filters, minRevenue: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Min. Business Health</label>
                                        <input type="range" min="0" max="100"
                                            className="w-full accent-emerald-500"
                                            value={filters.minBusinessHealth} onChange={(e) => setFilters({ ...filters, minBusinessHealth: Number(e.target.value) })}
                                        />
                                        <div className="text-xs text-right text-slate-500">{filters.minBusinessHealth}+</div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSearch}
                                className="w-full py-3 mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                {isSearching ? <Activity className="size-5 animate-spin" /> : <Search className="size-5" />}
                                {isSearching ? "Processing..." : "Apply Filters"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="lg:col-span-3">
                    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <h3 className="text-xl font-bold text-slate-800">
                            {results.length} Validated Opportunities
                        </h3>

                        {/* Sorting Dropdown */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                            <ArrowUpDown className="size-4 text-slate-400" />
                            <select
                                className="bg-transparent text-sm focus:outline-none text-slate-700 font-medium cursor-pointer"
                                value={filters.sortBy}
                                onChange={(e) => {
                                    setFilters({ ...filters, sortBy: e.target.value });
                                    setTimeout(handleSearch, 0);
                                }}
                            >
                                <option value="ai_score">Sort by AI Match</option>
                                <option value="newest">Newest Listed</option>
                                <option value="revenue_desc">Highest Revenue</option>
                                <option value="growth_desc">Highest Growth</option>
                                <option value="trust_desc">Highest Trust Score</option>
                                <option value="updated_desc">Recently Updated</option>
                                <option value="active_desc">Most Active</option>
                            </select>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <div className="py-32 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <Activity className="size-16 text-emerald-500 animate-spin mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Deal Flow...</h3>
                            <p className="text-slate-500">Evaluating multi-metric profiles and financials securely.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 pb-24">
                            {results.map((startup, idx) => {
                                const startupId = startup._id || startup.id;
                                const equityVal = Number(startup.equity) || 0;
                                const impliedValuation = equityVal > 0 ? startup.requested / (equityVal / 100) : 0;
                                
                                const approvedUpdates = getApprovedUpdates(startup);
                                const latestUpdate = approvedUpdates.length > 0 ? approvedUpdates[approvedUpdates.length - 1] : null;
                                const revGrowth = getGrowth(startup);
                                
                                const healthScore = calculateHealth(startup);
                                const healthStatus = getHealthStatus(healthScore);
                                
                                const recentRevs = approvedUpdates.slice(-6).map((u: any) => u.revenue);
                                const sparklinePath = generateMiniSparkline(recentRevs);

                                return (
                                    <div key={startupId}
                                        className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col gap-6 group relative animate-in fade-in slide-in-from-bottom-4"
                                        style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}
                                    >
                                        {/* Header Info */}
                                        <div className="flex gap-4 items-start">
                                            <div className="relative shrink-0">
                                                <div className="size-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                                                    <span className="text-2xl font-bold font-outfit text-slate-400">{startup?.name?.charAt(0) || 'S'}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    <h3 className="text-xl font-bold text-slate-900 font-outfit truncate group-hover:text-emerald-600 transition-colors">{startup.name}</h3>
                                                    {/* Smart Badges */}
                                                    {startup.isStudent && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="size-3"/> Student Startup</span>}
                                                    {(startup.credibility?.gstRegistered || startup.credibility?.panVerified) && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="size-3"/> KYC Verified</span>}
                                                    {approvedUpdates.length > 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold flex items-center gap-1"><ShieldCheck className="size-3"/> Financial Verified</span>}
                                                    {startup.score > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold flex items-center gap-1"><BrainCircuit className="size-3"/> AI Reviewed</span>}
                                                    {revGrowth > 20 && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold flex items-center gap-1"><TrendingUp className="size-3"/> Fast Growing</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 mb-3">
                                                    <span className="flex items-center gap-1"><Factory className="size-3 text-slate-400"/> {startup.sector || 'Various'}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{startup.businessModel || 'Any'}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{startup.stage || 'Seed'}</span>
                                                    {startup.location && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="flex items-center gap-1"><MapPin className="size-3 text-slate-400"/> {startup.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed pr-8">{startup.desc}</p>
                                                {startup.desc?.length > 120 && <Link href={`/startups/${startupId}`} className="text-emerald-600 text-xs font-bold hover:underline mt-1 inline-block">Read More</Link>}
                                            </div>
                                            
                                            {/* AI Match Circle (Top Right) */}
                                            <div className="shrink-0 flex flex-col items-center group-hover:scale-110 transition-transform duration-500 ml-auto">
                                                 <div className="relative size-16">
                                                    <svg className="size-full -rotate-90">
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * Math.min(100, startup.score)) / 100} className="text-emerald-500 drop-shadow-sm transition-all duration-1000" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-bold text-slate-900">{startup.score}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Match</span>
                                            </div>
                                        </div>

                                        {/* Grid Metrics */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                                            {/* Funding */}
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Funding Ask</h4>
                                                <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Asking Amount</span><span className="text-sm font-mono font-bold text-slate-900">{formatCurrency(startup.requested)}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Equity Offered</span><span className="text-sm font-bold text-emerald-600">{startup.equity}%</span></div>
                                                <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Valuation</span><span className="text-sm font-mono font-bold text-slate-900">{formatCurrency(impliedValuation)}</span></div>
                                            </div>
                                            
                                            {/* Financial Snapshot */}
                                            <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between items-center">
                                                    Financial Snapshot
                                                    {sparklinePath && (
                                                        <div className="relative h-4 w-12 group/spark">
                                                            <svg viewBox="0 0 40 20" className="size-full overflow-visible">
                                                                <path d={sparklinePath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            <div className="absolute hidden group-hover/spark:block bottom-full mb-1 right-0 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 shadow-lg">
                                                                Recent MRR Trend
                                                            </div>
                                                        </div>
                                                    )}
                                                </h4>
                                                {latestUpdate ? (
                                                    <>
                                                        <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Monthly Rev</span><span className="text-sm font-mono font-bold text-emerald-600">{formatCurrency(latestUpdate.revenue)}</span></div>
                                                        <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Monthly Profit</span><span className={`text-sm font-mono font-bold ${latestUpdate.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(latestUpdate.profit)}</span></div>
                                                        {latestUpdate.netLoss > 0 && <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Monthly Loss</span><span className="text-sm font-mono font-bold text-red-500">{formatCurrency(latestUpdate.netLoss)}</span></div>}
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500 font-medium">Revenue Growth</span>
                                                            {revGrowth !== 0 ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${revGrowth > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{revGrowth > 0 ? '↑' : '↓'} {Math.abs(revGrowth).toFixed(1)}%</span> : <span className="text-sm text-slate-400 font-medium">N/A</span>}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="py-4 text-center"><span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">No approved financial data yet.</span></div>
                                                )}
                                            </div>

                                            {/* AI & Health */}
                                            <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Business Health</h4>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500 font-medium">Health Score</span>
                                                    <div className="text-right">
                                                        <span className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1"><HeartPulse className={`size-3 ${healthStatus.color}`}/> {healthScore}/100</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${healthStatus.bg} ${healthStatus.color}`}>{healthStatus.text}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-2"><span className="text-sm text-slate-500 font-medium">Trust Score</span><span className="text-sm font-bold text-slate-800 flex items-center gap-1"><ShieldCheck className="size-3 text-blue-500"/> {getTrust(startup)}/100</span></div>
                                                <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Confidence</span><span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">High</span></div>
                                            </div>
                                        </div>

                                        {/* Bottom Actions Row */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 mt-1">
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 w-full sm:w-auto mb-4 sm:mb-0">
                                                <span className="flex items-center gap-1.5"><Users className="size-3.5 text-slate-400" /> Team: {startup.teamSize || 'N/A'}</span>
                                                <span className="flex items-center gap-1.5"><Briefcase className="size-3.5 text-slate-400" /> Investors: {startup.investorCount || 0}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-slate-400" /> Updated: {latestUpdate ? formatRelativeTime(latestUpdate.dateSubmitted) : formatRelativeTime(startup.createdAt || new Date())}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="flex items-center gap-1">
                                                    <div className="relative group/tt">
                                                        <button onClick={() => toggleSave(startupId)} className={`p-2 rounded-xl transition-all ${savedStartups.includes(startupId) ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                                                            <Bookmark className={`size-4 ${savedStartups.includes(startupId) ? 'fill-current' : ''}`}/>
                                                        </button>
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Save Startup</span>
                                                    </div>
                                                    
                                                    <div className="relative group/tt">
                                                        <button onClick={() => setShareModalData(startup)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Share2 className="size-4"/></button>
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Share Startup</span>
                                                    </div>

                                                    <div className="relative group/tt">
                                                        <button onClick={() => toggleCompare(startupId)} className={`p-2 rounded-xl transition-all ${compareList.includes(startupId) ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}>
                                                            <Scale className="size-4"/>
                                                        </button>
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Compare Startups</span>
                                                    </div>

                                                    <div className="relative group/tt">
                                                        <button onClick={() => toggleFollow(startupId)} className={`p-2 rounded-xl transition-all ${followedStartups.includes(startupId) ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                            <Bell className={`size-4 ${followedStartups.includes(startupId) ? 'fill-current' : ''}`}/>
                                                        </button>
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Follow Startup</span>
                                                    </div>
                                                </div>
                                                <Link href={`/startups/${startupId}`} className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ml-2 group/btn">
                                                    Explore Startup <ChevronRight className="size-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {results.length === 0 && (
                                <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                                    <BrainCircuit className="size-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-800">No matching deal flow found.</h3>
                                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Try widening your filters or searching across all sectors and stages.</p>
                                    <button
                                        onClick={() => setFilters({ ...filters, businessModel: "All", maxBurn: 100000000, maxCac: 10000000, minLtv: 0, minRoi: 0, minEquity: 0, minRevenue: 0, maxInvestment: 500000000, companyType: "All", revenueModel: "All", minRunway: 0, excludeLegalRisk: false, financialStatus: "All", minBusinessHealth: 0, location: "All" })}
                                        className="mt-6 text-sm font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Compare Floating Banner */}
            {compareList.length >= 2 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 border border-slate-700">
                    <div className="flex items-center gap-2">
                        <Scale className="size-5 text-emerald-400" />
                        <span className="font-bold text-sm whitespace-nowrap">{compareList.length} Selected for Comparison</span>
                    </div>
                    <Link href="/investors/compare" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-colors text-sm shadow-md whitespace-nowrap">
                        Compare Now
                    </Link>
                    <button onClick={() => {setCompareList([]); localStorage.setItem('inv_compare_list', '[]')}} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Share Modal */}
            {shareModalData && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-slate-900">Share Startup</h3>
                                <button onClick={() => setShareModalData(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X className="size-4"/></button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold font-outfit shrink-0">
                                    {shareModalData.name?.charAt(0) || 'S'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">{shareModalData.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{shareModalData.sector}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`); alert('Link copied!'); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Copy className="size-4"/></div>
                                    Copy Startup Link
                                </button>
                                <a href={`https://wa.me/?text=Check out this startup on InVolution: ${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600"><MessageCircle className="size-4"/></div>
                                    Share via WhatsApp
                                </a>
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Linkedin className="size-4"/></div>
                                    Share via LinkedIn
                                </a>
                                <a href={`mailto:?subject=Investment Opportunity: ${shareModalData.name}&body=Check out ${shareModalData.name} on InVolution!%0D%0A%0D%0A${shareModalData.desc}%0D%0A%0D%0AView Deal: ${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Mail className="size-4"/></div>
                                    Share via Email
                                </a>
                                <button onClick={() => {
                                    const summary = `Startup: ${shareModalData.name}\nIndustry: ${shareModalData.sector}\nAsking: ${formatCurrency(shareModalData.requested)}\nView Deal: ${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`;
                                    navigator.clipboard.writeText(summary); alert('Summary copied!'); 
                                }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><FileText className="size-4"/></div>
                                    Copy Startup Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
