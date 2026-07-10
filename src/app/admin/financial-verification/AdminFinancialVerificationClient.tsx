"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText, IndianRupee, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function AdminFinancialVerificationClient({ startups }: { startups: any[] }) {
    const router = useRouter();
    const toast = useToast();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [expandedStartup, setExpandedStartup] = useState<string | null>(null);
    const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; startupId: string; updateId: string; status: string; docStatus?: string } | null>(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Filter to only updates that are Pending
    const pendingUpdates: any[] = [];
    startups.forEach(startup => {
        const updates = startup.financial_updates || [];
        updates.forEach((update: any) => {
            if (update.status === 'Pending' || update.documentStatus === 'Pending') {
                pendingUpdates.push({ ...update, startupId: startup.id, startupName: startup.name, founderEmail: startup.owner_email, allUpdates: updates });
            }
        });
    });

    const handleAction = async (startupId: string, updateId: string, status: string, docStatus?: string) => {
        setApprovalModal({ isOpen: true, startupId, updateId, status, docStatus });
        setPassword("");
        setPasswordError("");
    };

    const confirmAction = async () => {
        if (!approvalModal) return;
        if (password !== "12345") {
            setPasswordError("Invalid Approval Password.");
            return;
        }

        const { startupId, updateId, status, docStatus } = approvalModal;

        setLoadingMap(prev => ({ ...prev, [updateId]: true }));
        try {
            const res = await fetch(`/api/admin/financials/${startupId}/${updateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: status,
                    documentStatus: docStatus || (status === 'Approved' ? 'Approved' : status),
                    remarks: remarksMap[updateId] || ""
                })
            });

            if (res.ok) {
                setApprovalModal(null);
                toast.success("✅ Financial update verified.");
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoadingMap(prev => ({ ...prev, [updateId]: false }));
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl">
            <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-2">Financial Verification</h1>
            <p className="text-slate-500 mb-8">Review and verify startup financial updates and supporting documents.</p>

            {pendingUpdates.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <CheckCircle2 className="size-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">All Caught Up!</h3>
                    <p className="text-slate-500 mt-2">There are no pending financial updates to review.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {pendingUpdates.map((update, idx) => (
                        <div key={update.id || idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{update.startupName}</h3>
                                            <p className="text-sm text-slate-500">{update.founderEmail}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Clock className="size-3" /> {update.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Reporting</p>
                                            <p className="font-medium text-slate-700">{update.reportingType} • {update.reportingDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Revenue</p>
                                            <p className="font-mono text-emerald-600 font-bold">₹{update.revenue}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Profit</p>
                                            <p className={`font-mono font-bold ${Number(update.profit) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>₹{update.profit}</p>
                                        </div>
                                        {update.netLoss && (
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-semibold">Net Loss</p>
                                                <p className="font-mono text-rose-500 font-bold">₹{update.netLoss}</p>
                                            </div>
                                        )}
                                    </div>

                                    {update.notes && (
                                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                            <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center gap-1"><MessageSquare className="size-3" /> Notes</p>
                                            <p className="text-sm text-slate-600">{update.notes}</p>
                                        </div>
                                    )}

                                    {update.documentUrl && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-4 text-slate-400" />
                                            <a href={update.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-600 hover:underline">
                                                View Supporting Document 
                                                {update.documentStatus && ` (${update.documentStatus})`}
                                            </a>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Admin Remarks (visible to founder)</label>
                                        <input 
                                            type="text" 
                                            placeholder="E.g. Document looks good, verified."
                                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
                                            value={remarksMap[update.id] || ""}
                                            onChange={(e) => setRemarksMap(prev => ({ ...prev, [update.id]: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[200px] border-l border-slate-100 pl-6">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Actions</p>
                                    <button 
                                        disabled={loadingMap[update.id]}
                                        onClick={() => handleAction(update.startupId, update.id, 'Approved', 'Approved')}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
                                    >
                                        <CheckCircle2 className="size-4" /> Approve All
                                    </button>
                                    <button 
                                        disabled={loadingMap[update.id]}
                                        onClick={() => handleAction(update.startupId, update.id, 'Request More Info')}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-bold rounded-lg transition-colors"
                                    >
                                        <AlertCircle className="size-4" /> Request Info
                                    </button>
                                    <button 
                                        disabled={loadingMap[update.id]}
                                        onClick={() => handleAction(update.startupId, update.id, 'Rejected', 'Rejected')}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 text-sm font-bold rounded-lg transition-colors"
                                    >
                                        <XCircle className="size-4" /> Reject
                                    </button>

                                    <div className="mt-auto pt-4">
                                        <button 
                                            onClick={() => setExpandedStartup(expandedStartup === update.id ? null : update.id)}
                                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                                        >
                                            {expandedStartup === update.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                            {expandedStartup === update.id ? "Hide History" : "View History"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* History Section */}
                            {expandedStartup === update.id && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-900 mb-4">Financial History</h4>
                                    <div className="space-y-3">
                                        {update.allUpdates.filter((u: any) => u.id !== update.id).map((hist: any, hidx: number) => (
                                            <div key={hidx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hist.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : hist.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                                        {hist.status}
                                                    </span>
                                                    <span className="font-semibold text-slate-700">{hist.reportingType} • {hist.reportingDate || hist.monthYear}</span>
                                                    <span className="text-emerald-600 font-mono">₹{hist.revenue} Rev</span>
                                                    <span className={`${Number(hist.profit) >= 0 ? 'text-emerald-600' : 'text-red-500'} font-mono`}>₹{hist.profit} Profit</span>
                                                </div>
                                                <span className="text-xs text-slate-400">{new Date(hist.dateSubmitted).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                        {update.allUpdates.length <= 1 && (
                                            <p className="text-sm text-slate-400 italic">No previous history available.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Password Modal */}
            {approvalModal && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
                                <AlertCircle className="size-5 text-indigo-500" /> Security Verification
                            </h2>
                            <button onClick={() => setApprovalModal(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <XCircle className="size-6" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <p className="text-sm text-slate-600">Please enter your approval password to confirm this action ({approvalModal.status}).</p>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Approval Password</label>
                                <input
                                    type="password"
                                    autoFocus
                                    placeholder="Enter password..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmAction()}
                                />
                                {passwordError && <p className="text-red-500 text-xs font-bold mt-2">{passwordError}</p>}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setApprovalModal(null)}
                                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-8 py-3 rounded-xl text-white font-bold transition-colors shadow-lg ${
                                    approvalModal.status === 'Approved' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 
                                    approvalModal.status === 'Rejected' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' :
                                    'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                                }`}
                            >
                                Confirm {approvalModal.status}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
