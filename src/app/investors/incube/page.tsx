"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Activity, ArrowUpDown, MapPin, Calendar, Users, GraduationCap, ChevronRight, Bookmark, Share2 } from "lucide-react";

export default function IncubeSearch() {
    const [filters, setFilters] = useState({
        keyword: "",
        industry: "All",
        stage: "All",
        tech: [] as string[],
        location: "All",
        minFunding: 0,
        maxFunding: 100000000,
        minEquity: 0,
        maxEquity: 100,
        sortBy: "ai_score"
    });

    const [isSearching, setIsSearching] = useState(false);
    const [allStartups, setAllStartups] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    const techOptions = ["AI / ML", "Web Application", "Mobile App", "IoT", "Cloud", "Blockchain", "Robotics", "Data Science", "Other"];
    const industryOptions = ["Artificial Intelligence", "Healthcare", "Education", "Agriculture", "FinTech", "SaaS", "Cyber Security", "E-commerce", "Robotics", "IoT", "Environment", "Social Impact", "Other"];
    const stageOptions = ["Idea Stage", "Research Stage", "Prototype Ready", "MVP Ready", "Beta Testing", "Early Users", "Other"];

    useEffect(() => {
        const fetchStartups = async () => {
            try {
                const res = await fetch('/api/incube');
                const json = await res.json();
                if (json.success) {
                    setAllStartups(json.data);
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

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        handleSearch();
    }, [filters]);

    const toggleTech = (t: string) => {
        setFilters(prev => ({
            ...prev,
            tech: prev.tech.includes(t) ? prev.tech.filter(x => x !== t) : [...prev.tech, t]
        }));
    };

    const handleSearch = () => {
        setIsSearching(true);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            const filtered = allStartups.filter(s => {
                const searchStr = filters.keyword.toLowerCase();
                const keywordMatch = !searchStr ||
                    s.name?.toLowerCase().includes(searchStr) ||
                    s.sector?.toLowerCase().includes(searchStr) ||
                    (s.desc && s.desc.toLowerCase().includes(searchStr)) ||
                    (s.tagline && s.tagline.toLowerCase().includes(searchStr));

                const indMatch = filters.industry === "All" || s.sector === filters.industry;
                const stageMatch = filters.stage === "All" || s.stage === filters.stage;
                const locMatch = filters.location === "All" || (s.city && s.city.toLowerCase().includes(filters.location.toLowerCase())) || (s.state && s.state.toLowerCase().includes(filters.location.toLowerCase()));

                const techMatch = filters.tech.length === 0 || filters.tech.some(t => (s.technology_used || []).includes(t));

                const fundAmount = s.requested || 0;
                const fundMatch = fundAmount >= filters.minFunding && fundAmount <= filters.maxFunding;

                const equityVal = s.equity || 0;
                const equityMatch = equityVal >= filters.minEquity && equityVal <= filters.maxEquity;

                return keywordMatch && indMatch && stageMatch && locMatch && techMatch && fundMatch && equityMatch;
            });

            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'ask_asc': return (a.requested || 0) - (b.requested || 0);
                    case 'equity_desc': return (b.equity || 0) - (a.equity || 0);
                    case 'ai_score':
                    default: return b.score - a.score;
                }
            });

            setResults(filtered);
            setIsSearching(false);
        }, 600);
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl min-h-screen bg-[#f8faf9]">
            <div className="text-center mb-12 animate-fade-in-up pt-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold mb-6 border border-emerald-200 shadow-sm">
                    <GraduationCap className="size-4" /> Incubation Center
                </div>
                <h1 className="text-4xl md:text-5xl font-outfit font-bold text-slate-900 mb-4">Discover Student Innovators</h1>
                <p className="text-slate-500 font-inter max-w-2xl mx-auto text-lg">
                    Explore innovative ideas from talented students under 24. Connect, collaborate, and invest in the next big breakthrough.
                </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">Filters</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Keywords</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <input type="text"
                                        placeholder="Search ideas, keywords..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSearch();
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Industry</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 appearance-none"
                                    value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                                >
                                    <option value="All">All Industries</option>
                                    {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Startup Stage</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 appearance-none"
                                    value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                                >
                                    <option value="All">All Stages</option>
                                    {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Technology Used</label>
                                <div className="flex flex-wrap gap-2">
                                    {techOptions.map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => toggleTech(t)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${filters.tech.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                                <input type="text" placeholder="City or State"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                    value={filters.location === "All" ? "" : filters.location} 
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value || "All" })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Funding Min (₹)</label>
                                    <input type="number" step="100000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        value={filters.minFunding} onChange={(e) => setFilters({ ...filters, minFunding: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Funding Max (₹)</label>
                                    <input type="number" step="100000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        value={filters.maxFunding} onChange={(e) => setFilters({ ...filters, maxFunding: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equity Min (%)</label>
                                    <input type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        value={filters.minEquity} onChange={(e) => setFilters({ ...filters, minEquity: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equity Max (%)</label>
                                    <input type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        value={filters.maxEquity} onChange={(e) => setFilters({ ...filters, maxEquity: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSearch}
                                className="w-full py-4 mt-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {isSearching ? <Activity className="size-5 animate-spin" /> : <Search className="size-5" />}
                                {isSearching ? "Processing..." : "Apply Filters"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="lg:col-span-3">
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <h3 className="text-xl font-bold text-slate-900">
                            {results.length} Student Ideas Found
                        </h3>

                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="size-4 text-slate-500" />
                            <select
                                className="bg-white border border-slate-200 font-bold rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 appearance-none"
                                value={filters.sortBy}
                                onChange={(e) => {
                                    setFilters({ ...filters, sortBy: e.target.value });
                                    setTimeout(handleSearch, 0);
                                }}
                            >
                                <option value="ai_score">Sort by AI Match Score</option>
                                <option value="ask_asc">Lowest Asking Amount</option>
                                <option value="equity_desc">Highest Equity Offered</option>
                            </select>
                        </div>
                    </div>

                    {isLoadingData ? (
                        <div className="py-24 text-center">
                            <Activity className="size-16 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900">Loading Student Ideas...</h3>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {results.map((startup, idx) => {
                                const teamSize = (startup.team_members?.length || 0) + 1; // Founder + Team

                                return (
                                    <div key={startup._id || startup.id}
                                        className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 group hover:shadow-md hover:border-blue-300 transition-all duration-300 relative"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                            {/* Top Header */}
                                            <div className="flex items-start gap-5">
                                                {startup.idea_logo_url ? (
                                                    <img src={startup.idea_logo_url} className="size-20 rounded-2xl object-cover bg-slate-50 shadow-sm border border-slate-100 shrink-0" />
                                                ) : (
                                                    <div className="size-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-sm">
                                                        {startup.name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 font-outfit mb-2 group-hover:text-blue-600 transition-colors">{startup.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-wide">{startup.sector}</span>
                                                        <span className="px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-xs font-bold tracking-wide">{startup.stage || "Idea"}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{startup.desc}</p>
                                                    
                                                    <div className="flex items-center gap-6 mt-4 text-xs font-bold text-slate-500">
                                                        <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {startup.city || "Remote"}, {startup.state}</span>
                                                        <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> Founded {new Date(startup.created_at).getFullYear()}</span>
                                                        <span className="flex items-center gap-1.5"><Users className="size-3.5" /> Team Size: {teamSize}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Match Top Right */}
                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Bookmark className="size-5" /></button>
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Share2 className="size-5" /></button>
                                                </div>
                                                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Match</span>
                                                        <span className={`${startup.score >= 80 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : startup.score >= 50 ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-red-600 border-red-200 bg-red-50'} text-[10px] font-bold border px-2 py-0.5 rounded-md mt-1`}>{startup.score >= 80 ? 'Incubation Ready' : startup.score >= 50 ? 'Promising' : 'Not Ready'}</span>
                                                    </div>
                                                    <div className="relative size-14">
                                                        <svg className="size-full -rotate-90">
                                                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                                                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="150" strokeDashoffset={150 - (150 * startup.score) / 100} className={`${startup.score >= 80 ? 'text-emerald-500' : startup.score >= 50 ? 'text-orange-500' : 'text-red-500'} transition-all duration-1000`} />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-xl font-bold text-slate-900">{startup.score}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gray Details Box */}
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 grid md:grid-cols-3 gap-6 mb-6">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Founder</div>
                                                <div className="flex items-center gap-3">
                                                    {startup.founder_photo_url ? (
                                                        <img src={startup.founder_photo_url} className="size-12 rounded-full object-cover shadow-sm border border-slate-200" />
                                                    ) : (
                                                        <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">{startup.full_name?.charAt(0)}</div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{startup.full_name}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{startup.education_type}, {startup.institution_name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Target Users</div>
                                                <div className="text-sm font-medium text-slate-700 leading-snug line-clamp-2">{startup.target_users || "General Audience"}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Current Stage</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-purple-500"></div>
                                                    <span className="font-bold text-slate-900 text-sm">{startup.stage || "Idea Phase"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metric Bars */}
                                        <div className="grid md:grid-cols-4 gap-6 pt-2 pb-6 border-b border-slate-100 mb-6">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Technologies Used</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {startup.technology_used?.slice(0, 3).map((t: string) => (
                                                        <span key={t} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 shadow-sm flex items-center gap-1">
                                                            <div className="size-1.5 rounded-full bg-blue-400"></div> {t}
                                                        </span>
                                                    ))}
                                                    {startup.technology_used?.length > 3 && <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500">+{startup.technology_used.length - 3}</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Funding Required</div>
                                                {startup.funding_required ? (
                                                    <div className="text-xl font-bold text-slate-900 font-mono">₹{(startup.requested / 100000).toFixed(1)} L</div>
                                                ) : (
                                                    <div className="text-sm font-bold text-slate-500 mt-2">Not Requested</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Equity Offered</div>
                                                {startup.funding_required ? (
                                                    <div className="text-xl font-bold text-blue-600">{startup.equity}%</div>
                                                ) : (
                                                    <div className="text-sm font-bold text-slate-500 mt-2">-</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Support Needed</div>
                                                <div className="text-xs font-semibold text-slate-700 leading-relaxed line-clamp-2">
                                                    {startup.support_needed?.join(', ') || "None explicitly requested"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                <span>Submitted {new Date(startup.created_at).toLocaleDateString()}</span>
                                                <span className="size-1 rounded-full bg-slate-300"></span>
                                                <span>Last Updated {new Date(startup.updated_at).toLocaleDateString()}</span>
                                            </div>
                                            <Link href={`/incube/${startup._id || startup.id}`} className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
                                                Explore Idea Details <ChevronRight className="size-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}

                            {results.length === 0 && (
                                <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                                    <GraduationCap className="size-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-800">No student ideas found.</h3>
                                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Try widening your search parameters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
