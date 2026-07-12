"use client";

import { X, ExternalLink, MapPin, Briefcase, TrendingUp, Link as LinkIcon, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";

interface InvestorProfileModalProps {
    investorId: string;
    onClose: () => void;
}

export default function InvestorProfileModal({ investorId, onClose }: InvestorProfileModalProps) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Since this is public info for deal room members, we need an API endpoint or use supabase client
                // Here we fetch via a new public endpoint or just fetch directly if RLS allows (which it might not for email)
                // Let's create a quick fetch to a new endpoint or existing one that returns public profile
                const res = await fetch(`/api/investors/public/${investorId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [investorId]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X className="size-5" />
                </button>

                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center text-slate-500 space-y-4">
                        <div className="size-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p>Loading Profile...</p>
                    </div>
                ) : profile ? (
                    <>
                        {/* Hero Section */}
                        <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                        
                        <div className="px-6 pb-8 relative -mt-16 text-center">
                            {/* Profile Image */}
                            <div className="inline-block relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name}`} 
                                    alt={profile.full_name} 
                                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg mx-auto bg-white"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl border-2 border-white shadow-sm" title="Verified Investor">
                                    <ShieldCheck className="size-5" />
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-slate-900 mt-4">{profile.full_name}</h2>
                            <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                <ShieldCheck className="size-4 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Verified by InVolution</span>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap justify-center gap-2 mt-5">
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full flex items-center gap-1">
                                    <Briefcase className="size-3.5 text-slate-500" /> {profile.investor_type}
                                </span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full flex items-center gap-1">
                                    <MapPin className="size-3.5 text-slate-500" /> {profile.city}, {profile.country}
                                </span>
                            </div>

                            <hr className="my-6 border-slate-100" />

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <TrendingUp className="size-5 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-slate-900">{profile.startups_invested_in}</p>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Startups Invested</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <Briefcase className="size-5 text-indigo-500 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-slate-900">{profile.years_of_experience}</p>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Experience</p>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="mt-6 flex flex-col gap-3">
                                {profile.linkedin_profile && (
                                    <a 
                                        href={profile.linkedin_profile} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                <LinkIcon className="size-4" />
                                            </div>
                                            <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">LinkedIn Profile</span>
                                        </div>
                                        <ExternalLink className="size-4 text-slate-400 group-hover:text-blue-500" />
                                    </a>
                                )}
                                {profile.portfolio_website && (
                                    <a 
                                        href={profile.portfolio_website} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                                <ExternalLink className="size-4" />
                                            </div>
                                            <span className="font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">Portfolio Website</span>
                                        </div>
                                        <ExternalLink className="size-4 text-slate-400 group-hover:text-indigo-500" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                        <User className="size-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-semibold text-slate-900">Profile Not Found</h3>
                        <p className="text-sm mt-1">This investor profile is either pending verification or does not exist.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
