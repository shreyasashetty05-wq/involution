"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ShieldCheck, PlayCircle, GraduationCap, Users, Lightbulb, CheckCircle, Share2, MapPin, Activity, Video, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import Navbar from "@/frontend/components/Navbar";
import { AIAnalysisCard } from "@/frontend/components/AIAnalysisCard";

export default function IncubeExploreIdea() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [application, setApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [openingDeal, setOpeningDeal] = useState(false);

    useEffect(() => {
        const fetchIdea = async () => {
            const { data, error } = await supabase
                .from("incubation_applications")
                .select("*")
                .eq("id", id)
                .single();

            if (data && !error) {
                setApplication(data);
            }
            setLoading(false);
        };
        fetchIdea();
    }, [id, supabase]);

    const handleOpenDealRoom = async () => {
        setOpeningDeal(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            router.push(`/messages?startupId=${application.id}&name=${encodeURIComponent(application.project_name)}&isStudent=true&institutionName=${encodeURIComponent(application.institution_name)}&incubationCentre=${encodeURIComponent(application.incubation_centre || '')}`);
        } catch (error) {
            console.error("Error opening deal room:", error);
            alert("Failed to open Deal Room. Please try again.");
            setOpeningDeal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
                <Loader2 className="size-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf9]">
                <ShieldCheck className="size-16 text-slate-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Idea Not Found</h2>
                <Link href="/investors/incube" className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Back to Discovery</Link>
            </div>
        );
    }

    // Combine founder and team members for the grid
    const allTeam = [
        {
            name: application.full_name,
            role: "Founder",
            bio: application.short_bio,
            photoUrl: application.founder_photo_url
        },
        ...(application.team_members || [])
    ];

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
        if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
        return url;
    };

    return (
        <div className="min-h-screen bg-[#f8faf9] flex flex-col">
            <Navbar />
            <div className="flex-1 container mx-auto px-6 py-12 max-w-[1400px] pt-24 space-y-8">
                
                <Link href="/investors/incube" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                    &larr; Back to Discover Ideas
                </Link>

                {/* HERO SECTION */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        {application.idea_logo_url ? (
                            <img src={application.idea_logo_url} className="size-32 rounded-[24px] object-cover border border-slate-100 shadow-sm shrink-0" />
                        ) : (
                            <div className="size-32 rounded-[24px] bg-slate-900 flex items-center justify-center font-bold text-white text-5xl shrink-0">
                                {application.project_name?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 font-outfit mb-3">{application.project_name}</h1>
                            <p className="text-lg text-slate-600 mb-4">{application.tagline || application.problem_statement?.substring(0, 80) + '...'}</p>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100">{application.industry}</span>
                                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-bold border border-purple-100">{application.current_stage}</span>
                                <span className="flex items-center gap-1.5 font-semibold text-slate-500 ml-2"><MapPin className="size-4" /> {application.city}, {application.state}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 pr-4 rounded-full">
                                    {application.founder_photo_url ? (
                                        <img src={application.founder_photo_url} className="size-10 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{application.full_name?.charAt(0)}</div>
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{application.full_name} <span className="text-slate-400 font-medium">Founder</span></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full">
                                    <GraduationCap className="size-4" /> {application.institution_name}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 w-full md:w-auto">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-sm transition-colors flex items-center gap-2 shadow-sm">
                                    <Share2 className="size-4" /> Share Idea
                                </button>
                                <button onClick={handleOpenDealRoom} disabled={openingDeal} className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2">
                                    {openingDeal ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Open Deal Room
                                </button>
                            </div>
                            <div className="flex flex-col items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl w-full">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Match Score</span>
                                <div className="relative size-20">
                                    <svg className="size-full -rotate-90">
                                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="214" strokeDashoffset={214 - (214 * application.ai_match_score) / 100} className="text-emerald-500" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-slate-900">{application.ai_match_score}</span>
                                    </div>
                                </div>
                                <span className="text-emerald-600 text-[10px] font-bold mt-2">High Match</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOUNDER & TEAM */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Users className="size-5 text-blue-500" /> Founder & Team</h2>
                        <span className="text-sm font-bold text-slate-500">Team Size: {allTeam.length}</span>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {allTeam.map((member, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                {member.photoUrl ? (
                                    <img src={member.photoUrl} className="size-24 rounded-2xl object-cover mx-auto mb-4 border border-slate-100" />
                                ) : (
                                    <div className="size-24 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-3xl mx-auto mb-4 border border-slate-200">
                                        {member.name?.charAt(0)}
                                    </div>
                                )}
                                <h3 className="font-bold text-slate-900">{member.name}</h3>
                                <div className={`inline-block px-3 py-1 text-[10px] font-bold rounded-md mt-2 mb-4 ${idx === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {member.role}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EDUCATIONAL BACKGROUND */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><GraduationCap className="size-5 text-indigo-500" /> Educational Background</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><GraduationCap className="size-4" /> Institution</div>
                            <div className="font-semibold text-slate-900">{application.institution_name}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="size-4" /> Education Type</div>
                            <div className="font-semibold text-slate-900">{application.education_type}</div>
                        </div>
                        {(application.course || application.diploma_course) && (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="size-4" /> Course / Degree</div>
                                <div className="font-semibold text-slate-900">{application.course || application.diploma_course}</div>
                            </div>
                        )}
                        {(application.branch || application.diploma_branch) && (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="size-4" /> Branch / Specialization</div>
                                <div className="font-semibold text-slate-900">{application.branch || application.diploma_branch}</div>
                            </div>
                        )}
                        {application.semester && (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar className="size-4" /> Current Year / Semester</div>
                                <div className="font-semibold text-slate-900">{application.semester}</div>
                            </div>
                        )}
                        {application.graduation_year && (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar className="size-4" /> Graduation Year</div>
                                <div className="font-semibold text-slate-900">{application.graduation_year}</div>
                            </div>
                        )}
                        {application.school_class && (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="size-4" /> Class</div>
                                <div className="font-semibold text-slate-900">{application.school_class}</div>
                            </div>
                        )}
                        {application.school_board && (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="size-4" /> Board</div>
                                <div className="font-semibold text-slate-900">{application.school_board}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* INCUBATION REQUIREMENTS */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><ShieldCheck className="size-5 text-blue-500" /> Incubation Requirements</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="border-r border-slate-100 pr-8">
                            <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Activity className="size-4" /> Funding Required</div>
                            {application.funding_required ? (
                                <div className="text-3xl font-bold text-slate-900 font-mono">₹{(application.ask_amount / 100000).toFixed(1)} L</div>
                            ) : (
                                <div className="text-xl font-bold text-slate-400">Not Requested</div>
                            )}
                        </div>
                        <div className="border-r border-slate-100 pr-8">
                            <div className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Activity className="size-4" /> Equity Offered</div>
                            {application.funding_required ? (
                                <div className="text-3xl font-bold text-slate-900">{application.equity_offered}%</div>
                            ) : (
                                <div className="text-xl font-bold text-slate-400">-</div>
                            )}
                        </div>
                        <div className="col-span-2">
                            <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2"><ShieldCheck className="size-4" /> Support Required</div>
                            <div className="flex flex-wrap gap-2">
                                {application.support_needed?.map((s: string) => (
                                    <span key={s} className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-xs font-bold">{s}</span>
                                ))}
                            </div>
                            
                            {application.fund_utilization && application.fund_utilization.length > 0 && (
                                <>
                                    <div className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 mt-8 flex items-center gap-2"><Activity className="size-4" /> How We'll Use the Funds</div>
                                    <div className="flex flex-wrap gap-2">
                                        {application.fund_utilization?.map((f: string) => (
                                            <span key={f} className="px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-xs font-bold">{f}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* IDEA OVERVIEW */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row gap-12">
                    <div className="shrink-0 space-y-8 w-48">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Lightbulb className="size-4 text-emerald-500" /> Industry</div>
                            <div className="font-semibold text-slate-900">{application.industry}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity className="size-4 text-purple-500" /> Current Stage</div>
                            <div className="font-semibold text-slate-900">{application.current_stage}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="size-4 text-blue-500" /> Target Users</div>
                            <div className="font-semibold text-slate-900">{application.target_users}</div>
                        </div>
                    </div>
                    <div className="grow space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-blue-600 mb-3">Problem Statement</h3>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">{application.problem_statement}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-600 mb-3">Proposed Solution</h3>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">{application.solution_description}</p>
                        </div>
                        {application.innovation_usp && (
                            <div>
                                <h3 className="text-lg font-bold text-blue-600 mb-3">Innovation / USP</h3>
                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">{application.innovation_usp}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PRODUCT INFORMATION */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity className="size-5 text-blue-500" /> Product Information</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Prototype Status</div>
                            <div className="flex items-center gap-3">
                                {application.prototype_available ? (
                                    <><CheckCircle className="size-6 text-emerald-500" /> <span className="font-bold text-slate-900">Yes, we have a prototype</span></>
                                ) : (
                                    <><ShieldCheck className="size-6 text-slate-400" /> <span className="font-bold text-slate-500">Not Available Yet</span></>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {application.prototype_link && (
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Prototype Link</div>
                                    <a href={application.prototype_link} target="_blank" className="text-sm font-semibold text-emerald-600 hover:underline line-clamp-1">{application.prototype_link}</a>
                                </div>
                            )}
                            {application.github_repo && (
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-32">GitHub Repository</div>
                                    <a href={application.github_repo} target="_blank" className="text-sm font-semibold text-emerald-600 hover:underline line-clamp-1">{application.github_repo}</a>
                                </div>
                            )}
                            {application.website && (
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Website</div>
                                    <a href={application.website} target="_blank" className="text-sm font-semibold text-emerald-600 hover:underline line-clamp-1">{application.website}</a>
                                </div>
                            )}
                            {!application.prototype_link && !application.github_repo && !application.website && (
                                <div className="text-sm font-bold text-slate-400">No external links provided.</div>
                            )}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Technology Used</div>
                            <div className="flex flex-wrap gap-2">
                                {application.technology_used?.length > 0 ? application.technology_used.map((t: string) => (
                                    <span key={t} className="px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg text-xs font-bold">{t}</span>
                                )) : <span className="text-sm font-bold text-slate-400">Not Provided</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* VALIDATION */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><CheckCircle className="size-5 text-blue-500" /> Validation</h2>
                    <div className="grid md:grid-cols-5 gap-6">
                        <div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="size-3" /> Number of Test Users</div>
                            <div className="font-semibold text-slate-900 text-sm">{application.test_users_count || "Not Provided"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle className="size-3" /> Pilot Testing Completed</div>
                            <div className="font-semibold text-slate-900 text-sm">{application.pilot_testing || "Not Provided"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShieldCheck className="size-3" /> Mentor Feedback Received</div>
                            <div className="font-semibold text-slate-900 text-sm">{application.mentor_feedback || "Not Provided"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="size-3" /> Competition / Hackathon</div>
                            <div className="font-semibold text-slate-900 text-sm">{application.hackathon_participation || "Not Provided"}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><PlayCircle className="size-3" /> Prototype Demonstrated</div>
                            <div className="font-semibold text-slate-900 text-sm">{application.prototype_demo || "Not Provided"}</div>
                        </div>
                    </div>
                </div>

                {/* PITCH VIDEO */}
                {application.pitch_videos && application.pitch_videos.length > 0 && application.pitch_videos[0] !== "" && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Video className="size-5 text-blue-500" /> Pitch Video</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-md">
                                    {getEmbedUrl(application.pitch_videos[0]) ? (
                                        <iframe 
                                            src={getEmbedUrl(application.pitch_videos[0])!} 
                                            className="w-full h-full" 
                                            allowFullScreen 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        ></iframe>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Unsupported Video Format</div>
                                    )}
                                </div>
                            </div>
                            {application.pitch_videos.length > 1 && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 text-sm">Additional Pitch Videos</h3>
                                    <div className="space-y-4">
                                        {application.pitch_videos.slice(1).map((v: string, idx: number) => {
                                            if (v === "") return null;
                                            return (
                                                <div key={idx} className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200">
                                                    {getEmbedUrl(v) ? (
                                                        <iframe src={getEmbedUrl(v)!} className="w-full h-full pointer-events-none" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 px-4 text-center break-all">{v}</div>
                                                    )}
                                                    <a href={v} target="_blank" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <PlayCircle className="size-10 text-white" />
                                                    </a>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AI STUDENT ANALYSIS */}
                <AIAnalysisCard 
                    type="incubation"
                    score={application.ai_analysis_timestamp ? application.ai_analysis_score : (application.ai_match_score || 0)}
                    executiveSummary={application.ai_executive_summary || application.ai_recommendation || ""}
                    strengths={application.ai_strengths || []}
                    improvements={application.ai_improvement_suggestions || []}
                    risks={application.ai_business_risks || []}
                    recommendation={application.ai_recommendation || ""}
                    confidence={application.ai_confidence || "Medium"}
                    scoreBreakdown={application.ai_score_breakdown}
                    stage={application.current_stage || "Idea Stage"}
                />

            </div>
        </div>
    );
}
