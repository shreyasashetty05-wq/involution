"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileSearch, ShieldAlert, Clock, Calendar, Download, RotateCw, ZoomIn, ZoomOut, AlertTriangle, ExternalLink, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

const REJECTION_REASONS = [
    "Aadhaar image is blurry.",
    "PAN image is blurry.",
    "Aadhaar image is cropped or incomplete.",
    "PAN image is cropped or incomplete.",
    "Aadhaar number does not match the uploaded document.",
    "PAN number does not match the uploaded document.",
    "Aadhaar document is unreadable.",
    "PAN document is unreadable.",
    "Wrong Aadhaar document uploaded.",
    "Wrong PAN document uploaded.",
    "Aadhaar and PAN belong to different individuals.",
    "Duplicate KYC submission detected.",
    "Image quality is too low.",
    "Document appears to be edited or tampered with.",
    "Required document is missing.",
    "Other..."
];

const MORE_INFO_REASONS = [
    "Please upload a clearer Aadhaar image.",
    "Please upload a clearer PAN image.",
    "Please upload the complete Aadhaar document.",
    "Please upload the complete PAN document.",
    "Please verify your Aadhaar number.",
    "Please verify your PAN number.",
    "Please upload the original document.",
    "Please resubmit both documents.",
    "Other..."
];

export default function AdminKYCDashboard() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDocsFor, setViewDocsFor] = useState<any>(null);
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; action: "Approved" | "Rejected" | "MoreInfo"; id: string; name: string } | null>(null);
    const [password, setPassword] = useState("");
    const [selectedReason, setSelectedReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [passwordError, setPasswordError] = useState("");
    
    // Viewer states
    const [zoomA, setZoomA] = useState(1);
    const [rotA, setRotA] = useState(0);
    const [zoomP, setZoomP] = useState(1);
    const [rotP, setRotP] = useState(0);

    const toast = useToast();

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

    const handleAction = (user: any, action: "Approved" | "Rejected" | "MoreInfo") => {
        setApprovalModal({ isOpen: true, action, id: user.id || user._id, name: user.name });
        setPassword("");
        setSelectedReason("");
        setRemarks("");
        setPasswordError("");
    };

    const confirmAction = async () => {
        if (!approvalModal) return;
        if (password !== "12345") {
            setPasswordError("Invalid Approval Password.");
            return;
        }

        if (approvalModal.action !== "Approved") {
            if (!selectedReason) {
                setPasswordError("Please select a reason.");
                return;
            }
            if (selectedReason === "Other..." && !remarks.trim()) {
                setPasswordError("Additional remarks are mandatory when 'Other...' is selected.");
                return;
            }
        }

        const finalRemarks = selectedReason === "Other..." ? remarks.trim() : selectedReason;

        try {
            const res = await fetch(`/api/kyc/${approvalModal.id}/review`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: approvalModal.action, remarks: approvalModal.action === "Approved" ? "" : finalRemarks })
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "Action failed");
                return;
            }

            toast.success(`✅ Application ${approvalModal.action.replace('MoreInfo', 'flagged for more info')}.`);
            
            setList(list.filter(item => (item.id || item._id) !== approvalModal.id));
            if (viewDocsFor && (viewDocsFor.id || viewDocsFor._id) === approvalModal.id) {
                setViewDocsFor(null);
            }
            setApprovalModal(null);
        } catch (err) {
            console.error("KYC Action Failed:", err);
            toast.error("An error occurred during verification.");
        }
    };

    const openViewer = (user: any) => {
        setViewDocsFor(user);
        setZoomA(1); setRotA(0);
        setZoomP(1); setRotP(0);
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <ShieldAlert className="size-8 text-indigo-600" />
                        KYC Admin Dashboard
                    </h1>
                    <p className="text-slate-500 font-inter">Review and approve document submissions for regulatory compliance.</p>
                </div>
                <div className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-400 flex items-center gap-2 shadow-sm">
                    <div className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-white font-bold">{list.length}</span> Pending Requests
                </div>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500">
                        <Clock className="size-8 animate-spin mb-4 text-indigo-500" />
                        Loading pending requests...
                    </div>
                ) : list.length === 0 ? (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 text-center animate-in zoom-in duration-500">
                        <div className="size-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="size-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">All Caught Up!</h3>
                        <p className="text-slate-500">No pending KYC applications to review.</p>
                    </div>
                ) : (
                    list.map((user) => {
                        const date = new Date(user.created_at || user.updated_at || Date.now());
                        const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                        
                        return (
                            <div key={user.id || user._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col xl:flex-row items-center justify-between gap-6 transition-all hover:border-indigo-200 hover:shadow-md group">
                                
                                <div className="flex items-center gap-5 w-full xl:w-[35%]">
                                    <div className="size-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0">
                                        {initial}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 truncate">
                                            {user.name}
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-600 border border-slate-200 font-medium">{user.type || 'Startup Founder'}</span>
                                        </h3>
                                        <p className="text-slate-500 text-sm truncate">{user.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-[45%] bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="col-span-1">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1 mb-1"><Calendar className="size-3" /> Submitted</p>
                                        <p className="text-sm font-semibold text-slate-700">{date.toLocaleDateString()}</p>
                                        <p className="text-xs text-slate-500">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1 mb-1"><Clock className="size-3" /> Status</p>
                                        <p className="text-sm font-semibold text-amber-600">Under Review</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Aadhaar (Masked)</p>
                                        <p className="text-sm font-mono font-medium text-slate-700">{user.aadhaar}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">PAN Pattern</p>
                                        <p className="text-sm font-mono font-medium text-slate-700">{user.pan}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full xl:w-[20%] shrink-0">
                                    <button onClick={() => openViewer(user)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center justify-center gap-2">
                                        <FileSearch className="size-4" /> Docs
                                    </button>
                                    
                                    <div className="flex flex-col gap-2 w-full sm:w-auto flex-1">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(user, "Rejected")} className="flex-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors flex items-center justify-center" title="Reject">
                                                <XCircle className="size-4" />
                                            </button>
                                            <button onClick={() => handleAction(user, "Approved")} className="flex-1 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors flex items-center justify-center shadow-sm" title="Approve">
                                                <CheckCircle className="size-4" />
                                            </button>
                                        </div>
                                        <button onClick={() => handleAction(user, "MoreInfo")} className="w-full px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-medium transition-colors flex items-center justify-center gap-1">
                                            <HelpCircle className="size-3" /> Request Info
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewDocsFor && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-hidden">
                    <div className="bg-[#18191d] border border-slate-800 rounded-3xl w-full h-[95vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-white font-outfit flex items-center gap-3">
                                    KYC Verification: <span className="text-indigo-400">{viewDocsFor.name}</span>
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">{viewDocsFor.email}</p>
                            </div>
                            <button onClick={() => setViewDocsFor(null)} className="text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">
                                <XCircle className="size-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid lg:grid-cols-2 gap-8">
                            
                            {/* Aadhaar Viewer */}
                            <div className="flex flex-col bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="size-4 text-indigo-400" />
                                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Aadhaar Document</h4>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setZoomA(z => Math.max(0.5, z - 0.25))} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md"><ZoomOut className="size-4"/></button>
                                        <button onClick={() => setZoomA(z => Math.min(3, z + 0.25))} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md"><ZoomIn className="size-4"/></button>
                                        <button onClick={() => setRotA(r => r + 90)} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md"><RotateCw className="size-4"/></button>
                                        <a href={viewDocsFor.aadhaar_file || viewDocsFor.aadhaarFile} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md" title="Open Original"><ExternalLink className="size-4"/></a>
                                        <a href={viewDocsFor.aadhaar_file || viewDocsFor.aadhaarFile} download={`Aadhaar_${viewDocsFor.name}.png`} className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 rounded-md ml-2" title="Download"><Download className="size-4"/></a>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[400px] relative">
                                    {(viewDocsFor.aadhaar_file || viewDocsFor.aadhaarFile) ? (
                                        <img 
                                            src={viewDocsFor.aadhaar_file || viewDocsFor.aadhaarFile} 
                                            alt="Aadhaar Scan" 
                                            className="max-w-full transition-transform duration-200" 
                                            style={{ transform: `scale(${zoomA}) rotate(${rotA}deg)` }}
                                        />
                                    ) : (
                                        <p className="text-slate-500">No Image Available</p>
                                    )}
                                </div>
                                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Aadhaar Number</p>
                                    <p className="font-mono text-xl text-white tracking-widest">{viewDocsFor.aadhaar}</p>
                                </div>
                            </div>

                            {/* PAN Viewer */}
                            <div className="flex flex-col bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <FileSearch className="size-4 text-orange-400" />
                                        <h4 className="text-sm font-semibold text-white uppercase tracking-widest">PAN Document</h4>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setZoomP(z => Math.max(0.5, z - 0.25))} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md"><ZoomOut className="size-4"/></button>
                                        <button onClick={() => setZoomP(z => Math.min(3, z + 0.25))} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md"><ZoomIn className="size-4"/></button>
                                        <button onClick={() => setRotP(r => r + 90)} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md"><RotateCw className="size-4"/></button>
                                        <a href={viewDocsFor.pan_file || viewDocsFor.panFile} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md" title="Open Original"><ExternalLink className="size-4"/></a>
                                        <a href={viewDocsFor.pan_file || viewDocsFor.panFile} download={`PAN_${viewDocsFor.name}.png`} className="p-1.5 text-orange-400 hover:text-orange-300 bg-orange-500/10 rounded-md ml-2" title="Download"><Download className="size-4"/></a>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[400px] relative">
                                    {(viewDocsFor.pan_file || viewDocsFor.panFile) ? (
                                        <img 
                                            src={viewDocsFor.pan_file || viewDocsFor.panFile} 
                                            alt="PAN Scan" 
                                            className="max-w-full transition-transform duration-200" 
                                            style={{ transform: `scale(${zoomP}) rotate(${rotP}deg)` }}
                                        />
                                    ) : (
                                        <p className="text-slate-500">No Image Available</p>
                                    )}
                                </div>
                                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">PAN Number</p>
                                    <p className="font-mono text-xl text-white tracking-widest">{viewDocsFor.pan}</p>
                                </div>
                            </div>

                        </div>

                        {/* Action Bar inside Modal */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-6 border-t border-white/10 shrink-0 bg-white/5">
                            <button onClick={() => handleAction(viewDocsFor, "MoreInfo")} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold transition-colors flex items-center justify-center gap-2 border border-orange-500/20">
                                <HelpCircle className="size-5" /> Request More Info
                            </button>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button onClick={() => handleAction(viewDocsFor, "Rejected")} className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition-colors border border-red-500/20 flex items-center justify-center gap-2">
                                    <XCircle className="size-5" /> Reject
                                </button>
                                <button onClick={() => handleAction(viewDocsFor, "Approved")} className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-slate-900 font-bold transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2">
                                    <CheckCircle className="size-5" /> Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password / Remarks Modal */}
            {approvalModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
                                <ShieldAlert className={`size-6 ${approvalModal.action === 'Approved' ? 'text-green-500' : approvalModal.action === 'Rejected' ? 'text-red-500' : 'text-orange-500'}`} /> 
                                Confirm {approvalModal.action === 'MoreInfo' ? 'Request Info' : approvalModal.action}
                            </h2>
                            <button onClick={() => setApprovalModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 p-1.5 rounded-full">
                                <XCircle className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-5 mb-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                You are about to <strong className="text-slate-900">{approvalModal.action === 'MoreInfo' ? 'Request More Info from' : approvalModal.action.toLowerCase()}</strong> <strong className="text-indigo-600">{approvalModal.name}</strong>.
                            </div>

                            {approvalModal.action !== "Approved" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                                            Reason for {approvalModal.action === 'Rejected' ? 'Rejection' : 'Request'}
                                        </label>
                                        <select
                                            autoFocus
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all cursor-pointer"
                                            value={selectedReason}
                                            onChange={(e) => { setSelectedReason(e.target.value); setPasswordError(""); }}
                                        >
                                            <option value="" disabled>Select a predefined reason...</option>
                                            {(approvalModal.action === 'Rejected' ? REJECTION_REASONS : MORE_INFO_REASONS).map((reason) => (
                                                <option key={reason} value={reason}>{reason}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {selectedReason === "Other..." && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Additional Remarks</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Please provide specific details..."
                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all resize-none"
                                                value={remarks}
                                                onChange={(e) => { setRemarks(e.target.value); setPasswordError(""); }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Admin Password</label>
                                <input
                                    type="password"
                                    autoFocus={approvalModal.action === 'Approved'}
                                    placeholder="Enter admin password (12345)"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all font-mono"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmAction()}
                                />
                                {passwordError && (
                                    <div className="mt-2 text-red-500 text-xs font-bold flex items-center gap-1.5 animate-in slide-in-from-top-1">
                                        <AlertTriangle className="size-3.5" /> {passwordError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setApprovalModal(null)} className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={
                                    !password || 
                                    (approvalModal.action !== 'Approved' && !selectedReason) || 
                                    (approvalModal.action !== 'Approved' && selectedReason === 'Other...' && !remarks.trim())
                                }
                                className={`px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    approvalModal.action === 'Approved' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' : 
                                    approvalModal.action === 'Rejected' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 
                                    'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                                }`}
                            >
                                {approvalModal.action === 'Approved' ? <CheckCircle className="size-4" /> : approvalModal.action === 'Rejected' ? <XCircle className="size-4" /> : <HelpCircle className="size-4" />}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
