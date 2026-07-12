"use client";

import { useState, useEffect } from "react";
import { Shield, User, Briefcase, TrendingUp, Link as LinkIcon, FileText, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminInvestorVerification() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [remarks, setRemarks] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    const fetchProfiles = async () => {
        try {
            const res = await fetch("/api/admin/investors?status=Pending Verification");
            const data = await res.json();
            if (data.profiles) {
                setProfiles(data.profiles);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleAction = async (status: string) => {
        if (!selectedProfile) return;

        let finalRemarks = remarks;
        if (status === "Rejected" && rejectReason) {
            finalRemarks = rejectReason;
        }

        try {
            const res = await fetch(`/api/admin/investors/${selectedProfile.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, admin_remarks: finalRemarks })
            });
            const data = await res.json();
            if (data.success) {
                setProfiles(prev => prev.filter(p => p.id !== selectedProfile.id));
                setSelectedProfile(null);
                setRemarks("");
                setRejectReason("");
            } else {
                alert(data.error || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!selectedProfile) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="size-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-slate-900">Investor Verification</h1>
                    </div>
                    
                    {profiles.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                            No pending investor verifications.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {profiles.map(p => (
                                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => setSelectedProfile(p)}>
                                    <div className="flex items-center gap-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={p.photo_url || `https://ui-avatars.com/api/?name=${p.full_name}`} alt={p.full_name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <h3 className="font-bold text-slate-900">{p.full_name}</h3>
                                            <p className="text-sm text-slate-500">{p.email} • {p.investor_type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending Review</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Shield className="size-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-slate-900">Investor Verification</h1>
                    </div>
                    <button onClick={() => setSelectedProfile(null)} className="text-slate-500 hover:text-slate-900 font-medium">Back to List</button>
                </div>
                <p className="text-slate-500 mb-8">Review and verify investor information and supporting documents.</p>

                {/* 1. Investor Information */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800"><User className="size-5 text-indigo-500" /> 1. Investor Information</h2>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedProfile.photo_url || `https://ui-avatars.com/api/?name=${selectedProfile.full_name}`} alt="Profile" className="w-32 h-32 rounded-xl object-cover shadow-sm border border-slate-100" />
                            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                <CheckCircle className="size-3" /> Verified KYC
                            </span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                            <div className="col-span-2">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    {selectedProfile.full_name}
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Profile Submitted</span>
                                </h3>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-2">✉️ {selectedProfile.email}</p>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">📞 {selectedProfile.phone_number}</p>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">📍 {selectedProfile.city}, {selectedProfile.country}</p>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">💼 {selectedProfile.occupation}</p>
                            </div>
                            
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Investor Type</p>
                                <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 inline-block px-2 py-1 rounded">{selectedProfile.investor_type}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                                <p className="text-sm font-semibold text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded">{selectedProfile.years_of_experience}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portfolio Website</p>
                                <a href={selectedProfile.portfolio_website} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{selectedProfile.portfolio_website || 'N/A'}</a>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Startups Invested In</p>
                                <p className="text-sm font-bold text-slate-900">{selectedProfile.startups_invested_in}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Investment Budget</p>
                                <p className="text-sm font-semibold text-purple-700 bg-purple-50 inline-block px-2 py-1 rounded">{selectedProfile.investment_budget}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Source of Funds</p>
                                <p className="text-sm font-semibold text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded">{selectedProfile.source_of_funds}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Professional Information */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800"><Briefcase className="size-5 text-purple-500" /> 2. Professional Information</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Company / Organization</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedProfile.company_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Designation</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedProfile.designation}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Official Website</p>
                            <a href={selectedProfile.official_website} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{selectedProfile.official_website || 'N/A'}</a>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Business Email</p>
                            <p className="text-sm font-medium text-slate-700">{selectedProfile.business_email || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Investment Experience */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800"><TrendingUp className="size-5 text-blue-500" /> 3. Investment Experience</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Investment Thesis</p>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedProfile.investment_thesis}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="size-3" /> Years of Experience</p>
                                <p className="text-lg font-bold text-emerald-600">{selectedProfile.years_of_experience}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="size-3" /> Total Startups</p>
                                <p className="text-lg font-bold text-blue-600">{selectedProfile.startups_invested_in}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Social & Professional Links */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800"><LinkIcon className="size-5 text-pink-500" /> 4. Social & Professional Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">LinkedIn Profile</p>
                            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                                <LinkIcon className="size-4 text-slate-400" />
                                <a href={selectedProfile.linkedin_profile} target="_blank" rel="noreferrer" className="text-sm text-slate-600 truncate hover:text-blue-600">{selectedProfile.linkedin_profile || 'N/A'}</a>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">X (Twitter)</p>
                            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                                <span className="font-bold text-slate-400 px-1">X</span>
                                <a href={selectedProfile.x_twitter} target="_blank" rel="noreferrer" className="text-sm text-slate-600 truncate hover:text-blue-600">{selectedProfile.x_twitter || 'N/A'}</a>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Personal Website</p>
                            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                                <LinkIcon className="size-4 text-slate-400" />
                                <a href={selectedProfile.personal_website} target="_blank" rel="noreferrer" className="text-sm text-slate-600 truncate hover:text-blue-600">{selectedProfile.personal_website || 'N/A'}</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Supporting Documents */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800"><FileText className="size-5 text-blue-500" /> 5. Supporting Documents</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {selectedProfile.supporting_documents && selectedProfile.supporting_documents.length > 0 ? (
                            selectedProfile.supporting_documents.map((doc: any, i: number) => (
                                <div key={i} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center justify-between h-32 bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <FileText className="size-6 text-emerald-500 mb-2" />
                                    <span className="text-xs font-semibold text-slate-700 line-clamp-2">{doc.title}</span>
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="mt-2 text-xs font-bold text-blue-600 hover:underline">View Document</a>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 col-span-5">No documents uploaded.</p>
                        )}
                    </div>
                </div>

                {/* 6. Admin Verification & Remarks */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800"><CheckCircle className="size-5 text-emerald-500" /> 6. Admin Verification</h2>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Admin Remarks (Visible to Investor)</label>
                        <textarea 
                            value={remarks} 
                            onChange={(e) => setRemarks(e.target.value)} 
                            placeholder="Write your remarks here..." 
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-emerald-500 outline-none" 
                            rows={3} 
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <button onClick={() => handleAction("Verified")} className="flex-1 w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <CheckCircle className="size-5" /> Approve Investor Profile
                        </button>
                        <button onClick={() => handleAction("Request More Information")} className="flex-1 w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <Clock className="size-5" /> Request More Information
                        </button>
                        
                        <div className="flex-1 w-full flex items-center gap-2">
                            <button onClick={() => handleAction("Rejected")} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <XCircle className="size-5" /> Reject Submission
                            </button>
                            <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-1/2 p-3 border border-slate-200 rounded-xl text-sm outline-none">
                                <option value="">Select reason</option>
                                <option value="Incomplete Information">Incomplete Information</option>
                                <option value="Invalid Documents">Invalid Documents</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
