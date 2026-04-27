"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileSearch, ShieldAlert } from "lucide-react";

// Remove mock arrays; fetching natively from MongoDB

export default function AdminKYCDashboard() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDocsFor, setViewDocsFor] = useState<any>(null); // For Image Modal

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch('/api/kyc/pending');
                const json = await res.json();
                if (json.success) setList(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);

    const handleAction = async (id: string, action: "Approved" | "Rejected") => {
        try {
            await fetch(`/api/kyc/${id}/review`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action })
            });
            // Optimistic UI removal
            setList(list.filter(item => item._id !== id));
            setViewDocsFor(null);
        } catch (err) {
            console.error("KYC Action Failed:", err);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl min-h-screen">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">KYC Admin Dashboard</h1>
                    <p className="text-slate-500 font-inter">Review and approve document submissions for regulatory compliance.</p>
                </div>
                <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-600">
                    <span className="text-slate-900 font-bold">{list.length}</span> Pending Requests
                </div>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 text-center text-slate-500">Loading pending requests from Database...</div>
                ) : list.length === 0 ? (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 text-center">
                        <CheckCircle className="size-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-600">All Caught Up!</h3>
                        <p className="text-slate-500">No pending KYC applications to review.</p>
                    </div>
                ) : (
                    list.map((user) => (
                        <div key={user._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:bg-white/[0.08]">
                            <div className="flex items-center gap-6 w-full lg:w-auto">
                                <div className={`size-14 rounded-full flex items-center justify-center font-bold text-xl ${user.matchScore > 80 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {user.matchScore}%
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        {user.name}
                                        {user.matchScore < 50 && <span title="Low OCR Match Score"><ShieldAlert className="size-4 text-orange-400" /></span>}
                                    </h3>
                                    <p className="text-slate-500 text-sm">{user.type}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 w-full lg:w-auto px-6 py-4 bg-slate-50 rounded-xl border border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Aadhaar (Masked)</p>
                                    <p className="font-mono text-slate-200">{user.aadhaar}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">PAN Pattern</p>
                                    <p className="font-mono text-slate-200">{user.pan}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full lg:w-auto shrink-0">
                                <button
                                    onClick={() => setViewDocsFor(user)}
                                    className="flex-1 lg:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileSearch className="size-4" />
                                    <span className="hidden sm:inline">Docs</span>
                                </button>
                                <button
                                    onClick={() => handleAction(user._id, "Rejected")}
                                    className="flex-1 lg:flex-none px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle className="size-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(user._id, "Approved")}
                                    className="flex-1 lg:flex-none px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-slate-900 font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                >
                                    <CheckCircle className="size-4" />
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewDocsFor && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-[#18191d] border border-slate-300 p-8 rounded-2xl w-full max-w-4xl shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-slate-900 font-outfit">KYC Profile: {viewDocsFor.name}</h2>
                            <button onClick={() => setViewDocsFor(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <XCircle className="size-8" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"><ShieldAlert className="size-4" /> Aadhaar Document</h4>
                                <div className="bg-white p-2 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden min-h-[250px]">
                                    {viewDocsFor.aadhaarFile ? (
                                        <img src={viewDocsFor.aadhaarFile} alt="Aadhaar Scan" className="max-w-full max-h-[400px] object-contain" />
                                    ) : (
                                        <p className="text-slate-600">No Document Payload</p>
                                    )}
                                </div>
                                <p className="font-mono text-center text-slate-600">{viewDocsFor.aadhaar}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"><ShieldAlert className="size-4" /> PAN Document</h4>
                                <div className="bg-white p-2 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden min-h-[250px]">
                                    {viewDocsFor.panFile ? (
                                        <img src={viewDocsFor.panFile} alt="PAN Scan" className="max-w-full max-h-[400px] object-contain" />
                                    ) : (
                                        <p className="text-slate-600">No Document Payload</p>
                                    )}
                                </div>
                                <p className="font-mono text-center text-slate-600">{viewDocsFor.pan}</p>
                            </div>
                        </div>

                        {/* Direct Action Bar inside Modal */}
                        <div className="flex gap-4 justify-end border-t border-white/10 pt-6">
                            <button
                                onClick={() => handleAction(viewDocsFor._id, "Rejected")}
                                className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition-colors"
                            >
                                Reject Application
                            </button>
                            <button
                                onClick={() => handleAction(viewDocsFor._id, "Approved")}
                                className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-slate-900 font-bold transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            >
                                Approve User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
