"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText, ChevronDown, ChevronUp, Building2, User, Mail, Calendar, Info, FileSpreadsheet, FileDigit, Link as LinkIcon, Briefcase, TrendingUp, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { formatRelativeTime } from "@/utils/timeHelper";

const formatCurrency = (val: number | string) => {
    if (!val && val !== 0) return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val));
};

export default function AdminFinancialVerificationClient({ startups }: { startups: any[] }) {
    const router = useRouter();
    const toast = useToast();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
    const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
    const [actionMap, setActionMap] = useState<Record<string, string>>({});
    const [rejectionReasonMap, setRejectionReasonMap] = useState<Record<string, string>>({});
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; startupId: string; updateId: string; status: string } | null>(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const pendingUpdates: any[] = [];
    startups.forEach(startup => {
        const updates = startup.financial_updates || [];
        updates.forEach((update: any) => {
            if (update.status === 'Pending' || update.documentStatus === 'Pending') {
                pendingUpdates.push({ 
                    ...update, 
                    startupId: startup.id, 
                    startupName: startup.name, 
                    founderEmail: startup.owner_email, 
                    industry: startup.industry || "Technology", 
                    founderName: startup.founder_name || "Founder", 
                    logo_url: startup.logo_url, 
                    allUpdates: updates 
                });
            }
        });
    });

    const handleActionClick = (updateId: string, action: string) => {
        setActionMap(prev => ({ ...prev, [updateId]: action }));
        if (action !== 'Reject') {
            setRejectionReasonMap(prev => { const next = {...prev}; delete next[updateId]; return next; });
        }
    };

    const triggerVerification = async (startupId: string, updateId: string) => {
        const action = actionMap[updateId];
        if (!action) {
            toast.error("Please select an action (Approve, Request More Info, Reject)");
            return;
        }
        
        let finalStatus = action;
        if (action === 'Approve') finalStatus = 'Approved';
        else if (action === 'Reject') finalStatus = 'Rejected';
        
        if (action === 'Reject' && !rejectionReasonMap[updateId]) {
            toast.error("Please select a rejection reason");
            return;
        }

        setApprovalModal({ isOpen: true, startupId, updateId, status: finalStatus });
        setPassword("");
        setPasswordError("");
    };

    const confirmAction = async () => {
        if (!approvalModal) return;
        if (password !== "12345") {
            setPasswordError("Invalid Approval Password.");
            return;
        }

        const { startupId, updateId, status } = approvalModal;
        
        let finalRemarks = remarksMap[updateId] || "";
        if (status === 'Rejected') {
            const reason = rejectionReasonMap[updateId];
            if (reason && reason !== 'Other') {
                finalRemarks = `${reason}. ${finalRemarks}`.trim();
            }
        }

        setLoadingMap(prev => ({ ...prev, [updateId]: true }));
        try {
            const res = await fetch(`/api/admin/financials/${startupId}/${updateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: status,
                    documentStatus: status === 'Approved' ? 'Approved' : status,
                    remarks: finalRemarks
                })
            });

            if (res.ok) {
                setApprovalModal(null);
                toast.success(`✅ Financial update ${status.toLowerCase()}.`);
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

    const rejectionReasons = [
        "Incomplete financial data",
        "Documents do not match declared revenue",
        "Bank statement missing or unreadable",
        "Other"
    ];

    const DocumentCard = ({ title, url, icon: Icon }: { title: string, url: string, icon: any }) => {
        if (!url) return null;
        return (
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <Icon className="size-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{title}</p>
                        <p className="text-xs text-slate-500">Uploaded</p>
                    </div>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 font-semibold text-xs rounded-lg transition-colors border border-slate-200">
                    View Document
                </a>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl">
            <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="size-8 text-emerald-500" />
                <h1 className="text-3xl font-bold font-outfit text-slate-900">Financial Verification</h1>
            </div>
            <p className="text-slate-500 mb-8 font-medium">Review and verify startup financial submissions.</p>

            {pendingUpdates.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                    <CheckCircle2 className="size-20 text-emerald-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-slate-900">All Caught Up!</h3>
                    <p className="text-slate-500 mt-2 text-lg">There are no pending financial updates to review.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {pendingUpdates.map((update, idx) => {
                        const pm = Number(update.revenue) > 0 ? ((Number(update.profit) / Number(update.revenue)) * 100).toFixed(1) : 0;
                        const hasDocs = (update.documents && Object.values(update.documents).some(v => !!v)) || update.documentUrl;
                        const previousVerifiedUpdates = update.allUpdates.filter((u: any) => u.id !== update.id && (u.status === 'Approved' || u.status === 'Rejected')).sort((a: any, b: any) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());

                        return (
                            <div key={update.id || idx} className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                
                                {/* 1. Startup Information */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <User className="size-4" /> 1. Startup Information
                                    </h2>
                                    <div className="flex flex-wrap md:flex-nowrap items-center gap-10">
                                        <div className="flex items-center gap-4">
                                            {update.logo_url ? (
                                                <img src={update.logo_url} alt="Logo" className="size-16 rounded-full border border-slate-200 object-cover" />
                                            ) : (
                                                <div className="size-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                    <Building2 className="size-6 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                                    {update.startupName}
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold rounded">AI Verified</span>
                                                </h3>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    <p className="text-sm text-slate-500 flex items-center gap-1.5"><Mail className="size-3.5" /> {update.founderEmail}</p>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1.5"><Briefcase className="size-3.5" /> Founder: {update.founderName}</p>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1.5"><Building2 className="size-3.5" /> Industry: {update.industry}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold mb-1">Reporting Type</p>
                                                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm font-semibold">{update.reportingType}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold mb-1">Reporting Date</p>
                                                <p className="text-sm font-semibold text-slate-900">{update.reportingDate || update.monthYear}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold mb-1">Submission Date</p>
                                                <p className="text-sm font-semibold text-slate-900">{new Date(update.dateSubmitted).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold mb-1">Status</p>
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-sm font-semibold">{update.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Financial Summary */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <FileDigit className="size-4" /> 2. Financial Summary
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                                            <p className="text-xs font-bold text-slate-500 mb-2">Total Revenue (₹)</p>
                                            <p className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(update.revenue)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                                            <p className="text-xs font-bold text-slate-500 mb-2">Total Expenses (₹)</p>
                                            <p className="text-lg font-bold text-red-600 font-mono">{formatCurrency(update.expenses)}</p>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${Number(update.profit) >= 0 ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}>
                                            <p className="text-xs font-bold text-slate-500 mb-2">Net Profit (₹)</p>
                                            <p className={`text-lg font-bold font-mono ${Number(update.profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(update.profit)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                                            <p className="text-xs font-bold text-slate-500 mb-2">Cash in Bank (₹)</p>
                                            <p className="text-lg font-bold text-indigo-600 font-mono">{formatCurrency(update.cashInBank)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50">
                                            <p className="text-xs font-bold text-slate-500 mb-2">Burn Rate (₹ / month)</p>
                                            <p className="text-lg font-bold text-amber-600 font-mono">{formatCurrency(update.burnRate)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                                            <p className="text-xs font-bold text-slate-500 mb-2">Profit Margin (%)</p>
                                            <p className="text-lg font-bold text-purple-600 font-mono">{pm}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-700 font-medium">
                                        <Info className="size-4" /> Runway is calculated automatically as Cash in Bank / Burn Rate = <span className="font-bold">{update.burnRate > 0 ? Math.round(Number(update.cashInBank) / Number(update.burnRate)) : 0} Months</span>
                                    </div>
                                </div>

                                {/* 3. Supporting Documents */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <LinkIcon className="size-4" /> 3. Supporting Documents
                                    </h2>
                                    {hasDocs ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {update.documents?.gstFiling && <DocumentCard title="GST Filing" url={update.documents.gstFiling} icon={FileText} />}
                                            {update.documents?.bankStatement && <DocumentCard title="Bank Statement" url={update.documents.bankStatement} icon={Building2} />}
                                            {update.documents?.profitAndLoss && <DocumentCard title="Profit & Loss Statement" url={update.documents.profitAndLoss} icon={FileSpreadsheet} />}
                                            {update.documents?.balanceSheet && <DocumentCard title="Balance Sheet" url={update.documents.balanceSheet} icon={FileText} />}
                                            {update.documents?.invoiceReport && <DocumentCard title="Invoice Report" url={update.documents.invoiceReport} icon={FileText} />}
                                            {update.documents?.salesReport && <DocumentCard title="Sales Report" url={update.documents.salesReport} icon={TrendingUp} />}
                                            {/* Legacy support */}
                                            {update.documentUrl && !update.documents?.gstFiling && <DocumentCard title="Supporting Document" url={update.documentUrl} icon={LinkIcon} />}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No supporting documents provided.</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5"><Info className="size-3.5" /> Click on any document to preview securely.</p>
                                </div>

                                {/* 4. Admin Verification */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <CheckCircle2 className="size-4" /> 4. Admin Verification
                                    </h2>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm font-bold text-slate-700">Decision <span className="text-red-500">*</span></p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button onClick={() => handleActionClick(update.id, 'Approve')} className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${actionMap[update.id] === 'Approve' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                    <CheckCircle2 className="size-4" /> Approve
                                                </button>
                                                <button onClick={() => handleActionClick(update.id, 'Request More Info')} className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${actionMap[update.id] === 'Request More Info' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                    <AlertCircle className="size-4" /> Request More Info
                                                </button>
                                                <button onClick={() => handleActionClick(update.id, 'Reject')} className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${actionMap[update.id] === 'Reject' ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                    <XCircle className="size-4" /> Reject
                                                </button>
                                            </div>
                                            <p className="text-xs text-emerald-600 font-medium mt-2">Please review all financial data and documents carefully before making a decision.</p>
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                            {actionMap[update.id] === 'Reject' && (
                                                <>
                                                    <p className="text-sm font-bold text-slate-700">If Rejected, select reason</p>
                                                    <select 
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-slate-800"
                                                        value={rejectionReasonMap[update.id] || ""}
                                                        onChange={(e) => setRejectionReasonMap(prev => ({...prev, [update.id]: e.target.value}))}
                                                    >
                                                        <option value="" disabled>Select reason...</option>
                                                        {rejectionReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Admin Remarks */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <MessageSquare className="size-4" /> 5. Admin Remarks <span className="text-xs font-normal lowercase normal-case">(Visible to Founder)</span>
                                    </h2>
                                    <textarea 
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 min-h-[100px]"
                                        placeholder={actionMap[update.id] === 'Reject' && rejectionReasonMap[update.id] === 'Other' ? "Provide a custom rejection reason..." : "Write your remarks here..."}
                                        value={remarksMap[update.id] || ""}
                                        onChange={(e) => setRemarksMap(prev => ({ ...prev, [update.id]: e.target.value }))}
                                    />
                                    <p className="text-right text-xs text-slate-400 mt-2">{remarksMap[update.id]?.length || 0}/1000</p>
                                </div>

                                {/* 6. Latest Financial Update */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <Calendar className="size-4" /> 6. Latest Financial Update <span className="text-xs font-normal lowercase normal-case">(This Submission)</span>
                                    </h2>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-8">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Reporting Type</p>
                                                <p className="text-sm font-semibold text-slate-900">{update.reportingType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Reporting Date</p>
                                                <p className="text-sm font-semibold text-slate-900">{update.reportingDate || update.monthYear}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Revenue (₹)</p>
                                                <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(update.revenue)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Expenses (₹)</p>
                                                <p className="text-sm font-bold font-mono text-red-600">{formatCurrency(update.expenses)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500">Net Profit (₹)</p>
                                                <p className={`text-sm font-bold font-mono ${Number(update.profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(update.profit)}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-sm font-bold">Pending</span>
                                    </div>
                                </div>

                                {/* 7. Previous Updates */}
                                <div className="p-8 bg-white border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-6 uppercase tracking-wider">
                                        <Clock className="size-4" /> 7. Previous Updates
                                    </h2>
                                    {previousVerifiedUpdates.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Show only first verified update by default */}
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500">Reporting Type</p>
                                                        <p className="text-sm font-semibold text-slate-900">{previousVerifiedUpdates[0].reportingType}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500">Reporting Date</p>
                                                        <p className="text-sm font-semibold text-slate-900">{previousVerifiedUpdates[0].reportingDate || previousVerifiedUpdates[0].monthYear}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500">Revenue (₹)</p>
                                                        <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(previousVerifiedUpdates[0].revenue)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500">Expenses (₹)</p>
                                                        <p className="text-sm font-bold font-mono text-red-600">{formatCurrency(previousVerifiedUpdates[0].expenses)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500">Net Profit (₹)</p>
                                                        <p className={`text-sm font-bold font-mono ${Number(previousVerifiedUpdates[0].profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(previousVerifiedUpdates[0].profit)}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded text-sm font-bold ${previousVerifiedUpdates[0].status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                    {previousVerifiedUpdates[0].status}
                                                </span>
                                            </div>

                                            {previousVerifiedUpdates.length > 1 && (
                                                <div>
                                                    <button onClick={() => setExpandedHistory(expandedHistory === update.id ? null : update.id)} className="text-sm font-bold text-indigo-600 flex items-center gap-1 mt-4 hover:underline">
                                                        {expandedHistory === update.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                        View All Previous Updates
                                                    </button>
                                                    
                                                    {expandedHistory === update.id && (
                                                        <div className="mt-4 space-y-4">
                                                            {previousVerifiedUpdates.slice(1).map((prev: any, pidx: number) => (
                                                                <div key={pidx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                    <div className="flex items-center gap-8">
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500">Reporting Type</p>
                                                                            <p className="text-sm font-semibold text-slate-900">{prev.reportingType}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500">Reporting Date</p>
                                                                            <p className="text-sm font-semibold text-slate-900">{prev.reportingDate || prev.monthYear}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500">Revenue (₹)</p>
                                                                            <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(prev.revenue)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500">Expenses (₹)</p>
                                                                            <p className="text-sm font-bold font-mono text-red-600">{formatCurrency(prev.expenses)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-500">Net Profit (₹)</p>
                                                                            <p className={`text-sm font-bold font-mono ${Number(prev.profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(prev.profit)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`px-3 py-1 rounded text-sm font-bold ${prev.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                                        {prev.status}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No previous verified updates available.</p>
                                    )}
                                </div>

                                {/* Bottom Actions */}
                                <div className="p-8 bg-slate-100/50 flex flex-col md:flex-row gap-4">
                                    <button 
                                        disabled={loadingMap[update.id]}
                                        onClick={() => { handleActionClick(update.id, 'Approve'); triggerVerification(update.startupId, update.id); }}
                                        className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-70"
                                    >
                                        <CheckCircle2 className="size-5" /> Approve Financial Update
                                    </button>
                                    <button 
                                        disabled={loadingMap[update.id]}
                                        onClick={() => { handleActionClick(update.id, 'Request More Info'); triggerVerification(update.startupId, update.id); }}
                                        className="flex-1 py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-70"
                                    >
                                        <AlertCircle className="size-5" /> Request More Information
                                    </button>
                                    <button 
                                        disabled={loadingMap[update.id]}
                                        onClick={() => { handleActionClick(update.id, 'Reject'); triggerVerification(update.startupId, update.id); }}
                                        className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-70"
                                    >
                                        <XCircle className="size-5" /> Reject Submission
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Password Modal */}
            {approvalModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
                                <AlertCircle className="size-5 text-indigo-500" /> Security Verification
                            </h2>
                            <button onClick={() => setApprovalModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <XCircle className="size-6" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <p className="text-sm text-slate-600 font-medium">Please enter your approval password to confirm this action <span className="font-bold text-slate-900">({approvalModal.status})</span>.</p>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Approval Password</label>
                                <input
                                    type="password"
                                    autoFocus
                                    placeholder="Enter password (12345)..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all font-mono"
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
