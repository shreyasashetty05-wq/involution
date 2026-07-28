"use client";

import React, { useState, useEffect } from "react";
import { Handshake, MessageSquare, History, PieChart, CheckCircle2, Lock, ChevronRight, Edit2, Send, Loader2, CheckSquare, Trash2, MoreVertical, Check } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from "recharts";

type TermField = "investment_amount" | "valuation" | "equity" | "investment_type" | "funding_round" | "board_seat" | "liquidation_preference" | "closing_date";

interface TermData {
    investment_amount: number;
    valuation: number;
    equity: number;
    investment_type: string;
    funding_round: string;
    board_seat: string;
    liquidation_preference: string;
    closing_date: string;
}

function CurrencyInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
    const [displayVal, setDisplayVal] = useState(value ? value.toLocaleString('en-IN') : "");

    useEffect(() => {
        if (!displayVal.replace(/[^0-9]/g, '') && value === 0) return;
        setDisplayVal(value ? value.toLocaleString('en-IN') : "0");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (!raw) {
            onChange(0);
            setDisplayVal("");
            return;
        }
        const num = parseInt(raw, 10);
        onChange(num);
        setDisplayVal(num.toLocaleString('en-IN'));
    };

    return (
        <div className="relative w-full">
            <span className="absolute left-3 top-1.5 text-slate-500 text-sm">₹</span>
            <input 
                type="text" 
                value={displayVal} 
                onChange={handleChange}
                disabled={disabled}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none focus:border-blue-400 disabled:opacity-70"
            />
        </div>
    );
}

export function NegotiationTab({ 
    dealId, 
    isStartup, 
    startupName, 
    investorName, 
    onLock,
    isStudent = false
}: { 
    dealId: string; 
    isStartup: boolean; 
    startupName: string; 
    investorName: string;
    onLock: () => void;
    isStudent?: boolean;
}) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [negotiation, setNegotiation] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [resolvedRole, setResolvedRole] = useState<'startup' | 'investor'>('investor');
    
    const [messageInput, setMessageInput] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [showProceedDialog, setShowProceedDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    
    const [editTerms, setEditTerms] = useState<TermData>({
        investment_amount: 0,
        valuation: 0,
        equity: 0,
        investment_type: "Equity",
        funding_round: "Seed",
        board_seat: "1",
        liquidation_preference: "1x Non-Participating",
        closing_date: new Date().toISOString().split('T')[0]
    });
    
    const toast = useToast();

    const currentVersion = versions.length > 0 ? versions[0] : null;
    const previousVersion = versions.length > 1 ? versions[1] : null;

    useEffect(() => {
        fetchNegotiationData();
    }, [dealId]);

    const fetchNegotiationData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/deals/negotiation?dealId=${dealId}`);
            if (res.ok) {
                const data = await res.json();
                setNegotiation(data.negotiation);
                setVersions(data.versions);
                setDiscussions(data.discussions);
                if (data.userRole) {
                    setResolvedRole(data.userRole);
                }

                // Populate form
                if (data.versions.length > 0) {
                    const latest = data.versions[0];
                    setEditTerms({
                        investment_amount: latest.investment_amount,
                        valuation: latest.valuation,
                        equity: latest.equity,
                        investment_type: latest.investment_type,
                        funding_round: latest.funding_round,
                        board_seat: latest.board_seat,
                        liquidation_preference: latest.liquidation_preference,
                        closing_date: latest.closing_date
                    });
                } else if (data.initialTemplate) {
                    setEditTerms(data.initialTemplate);
                }
            }
        } catch (error) {
            console.error(error);
            toast.warning("Failed to load negotiation data");
        } finally {
            setLoading(false);
        }
    };

    const validateTerms = () => {
        if (editTerms.investment_amount < 0 || editTerms.valuation < 0) {
            toast.warning("Amounts cannot be negative");
            return false;
        }
        if (editTerms.equity <= 0 || editTerms.equity > 100) {
            toast.warning("Equity must be between 1 and 100");
            return false;
        }
        if (!editTerms.closing_date) {
            toast.warning("Closing date is required");
            return false;
        }
        return true;
    };

    const handlePropose = async () => {
        if (!validateTerms()) return;

        setSubmitting(true);
        try {
            const calculatedValuation = (editTerms.investment_amount && editTerms.equity > 0) ? (editTerms.investment_amount / (editTerms.equity / 100)) : 0;
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'propose',
                    senderType: isStartup ? 'startup' : 'investor',
                    terms: { ...editTerms, valuation: calculatedValuation }
                })
            });
            if (res.ok) {
                toast.success("Offer Sent");
                setIsEditing(false);
                fetchNegotiationData();
            } else {
                const err = await res.json();
                toast.warning(err.error || "Failed to send offer");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'accept',
                    senderType: isStartup ? 'startup' : 'investor'
                })
            });
            if (res.ok) {
                toast.success("Terms Accepted");
                fetchNegotiationData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const executeReject = async () => {
        setShowRejectDialog(false);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'reject',
                    senderType: isStartup ? 'startup' : 'investor'
                })
            });
            if (res.ok) {
                toast.success("Offer Rejected");
                fetchNegotiationData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleContinueNegotiation = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'continue',
                    senderType: isStartup ? 'startup' : 'investor'
                })
            });
            if (res.ok) {
                toast.success("Negotiation resumed!");
                fetchNegotiationData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLock = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'lock',
                    senderType: isStartup ? 'startup' : 'investor'
                })
            });
            if (res.ok) {
                toast.success("Negotiation Locked. Proceeding to Phase 5.");
                onLock();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        
        if (editingMessageId) {
            try {
                const res = await fetch(`/api/deals/negotiation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dealId,
                        action: 'edit_message',
                        senderType: isStartup ? 'startup' : 'investor',
                        messageId: editingMessageId,
                        message: messageInput
                    })
                });
                if (res.ok) {
                    setMessageInput("");
                    setEditingMessageId(null);
                    fetchNegotiationData();
                }
            } catch (error) {
                console.error(error);
            }
            return;
        }

        try {
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'message',
                    senderType: amIStartup ? 'startup' : 'investor',
                    message: messageInput
                })
            });
            if (res.ok) {
                setMessageInput("");
                fetchNegotiationData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            const res = await fetch(`/api/deals/negotiation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action: 'delete_message',
                    senderType: resolvedRole,
                    messageId
                })
            });
            if (res.ok) {
                fetchNegotiationData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (val: any) => `₹ ${Number(val).toLocaleString('en-IN')}`;

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500 size-8" /></div>;
    }

    const isLocked = negotiation?.is_locked || negotiation?.status === 'Negotiation Locked';
    const isAccepted = negotiation?.status === 'Negotiation Accepted' || negotiation?.status === 'Accepted';
    const isPendingInvestorFinalApproval = negotiation?.status === 'Pending Investor Final Approval';
    const isRejected = negotiation?.status === 'Negotiation Rejected' || negotiation?.status === 'Rejected';
    
    const amIStartup = resolvedRole === 'startup';
    const rejectedByMe = isRejected && currentVersion?.action === 'Rejected' && currentVersion?.proposed_by_type === resolvedRole;

    // waitingForMe handles the core logic of whether action buttons should appear
    // Startup CANNOT act on Initial Offer (it's theirs)
    const waitingForMe = (!amIStartup && negotiation?.status === 'Initial Offer Available') || 
                         (amIStartup && negotiation?.status === 'Waiting for Startup Response') ||
                         (!amIStartup && negotiation?.status === 'Waiting for Investor Response');
                         
    const waitingForThem = (amIStartup && negotiation?.status === 'Initial Offer Available') || 
                           (!amIStartup && negotiation?.status === 'Waiting for Startup Response') ||
                           (amIStartup && negotiation?.status === 'Waiting for Investor Response') ||
                           (amIStartup && isPendingInvestorFinalApproval) ||
                           (amIStartup && isAccepted);
    
    const needsInitialOffer = versions.length === 0;

    const checkStatus = (key: TermField) => {
        if (isAccepted) return true;
        if (!currentVersion || !previousVersion) return false;
        return currentVersion[key] === previousVersion[key];
    };

    const checklistFields: {key: TermField, label: string}[] = [
        { key: "investment_amount", label: "Investment Amount" },
        { key: "valuation", label: "Valuation" },
        { key: "equity", label: "Equity Percentage" },
        { key: "investment_type", label: "Investment Type" },
        { key: "board_seat", label: "Board Seat" },
        { key: "liquidation_preference", label: "Liquidation Preference" },
        { key: "closing_date", label: "Expected Closing Date" }
    ];

    const checkedCount = checklistFields.filter(f => checkStatus(f.key)).length;
    const progress = versions.length === 0 ? 0 : Math.round((checkedCount / checklistFields.length) * 100);
    const allChecked = checkedCount === checklistFields.length || isAccepted;

    const dataForChart = [
        { name: 'Founder Equity', value: 100 - (editTerms.equity || 0), color: '#34d399' },
        { name: 'Investor Equity', value: editTerms.equity || 0, color: '#6366f1' },
    ];
    
    const currentValuation = currentVersion ? currentVersion.valuation : 0;
    const previousValuation = previousVersion ? previousVersion.valuation : 0;
    const dynamicValuation = (editTerms.investment_amount && editTerms.equity > 0) ? (editTerms.investment_amount / (editTerms.equity / 100)) : 0;

    return (
        <div className="flex flex-col h-full bg-[#f4f6f5] overflow-y-auto p-4 md:p-6 pb-24 relative">
            {/* Header row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Handshake className="size-4 text-blue-600" />
                        </div>
                        Phase 4: Negotiation
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Define and agree on key investment terms before moving to legal agreements.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`size-2.5 rounded-full ${isAccepted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <p className="font-semibold text-slate-800 text-sm">{negotiation?.status || "Drafting Initial Offer"}</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Negotiation Progress</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="font-bold text-slate-800 text-sm">{progress}%</p>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${isAccepted ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Investment Terms */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Edit2 className="size-4 text-slate-500" /> Investment Terms
                            </h3>
                            {currentVersion && (
                                <div className="text-xs text-slate-400">
                                    <span className="mr-6">Current Offer (v{versions.length})</span>
                                    <span>{previousVersion ? `Your Previous (v${versions.length - 1})` : ''}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: "investment_amount", label: "Investment Amount", type: "currency" },
                                { key: "valuation", label: "Pre-money Valuation", type: "currency", readonly: true },
                                { key: "equity", label: "Equity Offered (%)", type: "number", max: 100 },
                                { key: "investment_type", label: "Investment Type", type: "text", readonly: true },
                                { key: "funding_round", label: "Funding Round", type: "text", readonly: true },
                                { key: "board_seat", label: "Board Seat", type: "select", options: ["0", "1", "Observer"] },
                                { key: "liquidation_preference", label: "Liquidation Preference", type: "select", options: ["1x Non-Participating", "1x Participating", "2x Preference"] },
                                { key: "closing_date", label: "Expected Closing Date", type: "date" }
                            ].map((field) => (
                                <div key={field.key} className="flex items-center justify-between group">
                                    <p className="text-sm text-slate-600 w-1/3 font-medium flex items-center gap-2">
                                        {checkStatus(field.key as TermField) ? <Check className="size-3 text-emerald-500" /> : <span className="size-3" />}
                                        {field.label}
                                    </p>
                                    
                                    <div className="w-1/3">
                                        {isEditing ? (
                                            field.readonly ? (
                                                <p className="text-sm font-semibold text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
                                                    {field.type === "currency" ? (field.key === 'valuation' ? formatCurrency(dynamicValuation) : formatCurrency(editTerms[field.key as TermField])) : editTerms[field.key as TermField]}
                                                </p>
                                            ) : field.type === "currency" ? (
                                                <CurrencyInput 
                                                    value={editTerms[field.key as TermField] as number} 
                                                    onChange={(val) => setEditTerms({...editTerms, [field.key]: val})} 
                                                />
                                            ) : field.type === "select" ? (
                                                <select 
                                                    value={editTerms[field.key as TermField]} 
                                                    onChange={(e) => setEditTerms({...editTerms, [field.key]: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                                                >
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <input 
                                                    type={field.type} 
                                                    max={field.max}
                                                    value={editTerms[field.key as TermField]} 
                                                    onChange={(e) => setEditTerms({...editTerms, [field.key]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                                                />
                                            )
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                                {field.type === "currency" ? formatCurrency(field.key === 'valuation' ? currentValuation : editTerms[field.key as TermField]) : 
                                                 field.key === "equity" ? `${editTerms.equity}%` :
                                                 editTerms[field.key as TermField]}
                                                {!isLocked && !isAccepted && !isRejected && !field.readonly && (
                                                    <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity">
                                                        <Edit2 className="size-3" />
                                                    </button>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-1/3 text-right">
                                        <p className="text-sm text-slate-400">
                                            {previousVersion ? (
                                                field.type === "currency" ? formatCurrency(field.key === 'valuation' ? previousValuation : previousVersion[field.key]) : 
                                                field.key === "equity" ? `${previousVersion.equity}%` :
                                                previousVersion[field.key]
                                            ) : "-"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors hover:bg-slate-200">
                                        Cancel Changes
                                    </button>
                                    <button onClick={handlePropose} disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm transition-colors hover:bg-blue-700 disabled:opacity-50">
                                        {needsInitialOffer ? "Send Initial Offer" : "Send Counter Offer"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {!isLocked && !isAccepted && !isRejected && (
                                        (needsInitialOffer && isStartup) ? (
                                            <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-2">
                                                <Edit2 className="size-4" /> Edit & Send Initial Offer
                                            </button>
                                        ) : (!needsInitialOffer && waitingForMe) ? (
                                            <button onClick={() => {
                                                if (currentVersion) {
                                                    setEditTerms({
                                                        investment_amount: currentVersion.investment_amount,
                                                        valuation: currentVersion.valuation,
                                                        equity: currentVersion.equity,
                                                        investment_type: currentVersion.investment_type,
                                                        funding_round: currentVersion.funding_round,
                                                        board_seat: currentVersion.board_seat,
                                                        liquidation_preference: currentVersion.liquidation_preference,
                                                        closing_date: currentVersion.closing_date
                                                    });
                                                }
                                                setIsEditing(true);
                                            }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-2">
                                                <Edit2 className="size-4" /> Create Counter Offer
                                            </button>
                                        ) : null
                                    )}
                                    
                                    {waitingForMe && !isEditing && (
                                        <>
                                            <button onClick={() => setShowRejectDialog(true)} disabled={submitting} className="flex-1 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl text-sm transition-colors hover:bg-red-100 border border-red-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                                Reject Offer
                                            </button>
                                            <button onClick={handleAccept} disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                                <CheckCircle2 className="size-4" /> Accept Offer
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Checklist & Lock */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <CheckSquare className="size-4 text-emerald-600" /> Negotiation Checklist
                        </h3>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
                            {checklistFields.map((item) => (
                                <div key={item.key} className="flex items-center gap-2">
                                    {checkStatus(item.key) ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <div className="size-3.5 rounded-full border border-slate-300" />}
                                    <span className={`text-xs ${checkStatus(item.key) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        {/* Action Area */}
                        {isAccepted && !isLocked && (
                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between mt-6">
                                <div>
                                    <h3 className="font-bold text-emerald-800 text-lg mb-1">Negotiation Successful</h3>
                                    <p className="text-emerald-600 text-sm mb-4">Terms have been mutually agreed upon.</p>
                                    
                                    {amIStartup ? (
                                        <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" /> Waiting for Investor to Proceed to Phase 5...
                                        </p>
                                    ) : (
                                        <button onClick={() => setShowProceedDialog(true)} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                                            Proceed to Smart Agreement
                                        </button>
                                    )}
                                </div>
                                <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="size-6 text-emerald-600" />
                                </div>
                            </div>
                        )}
                        {isPendingInvestorFinalApproval && (
                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between mt-6">
                                <div>
                                    <h3 className="font-bold text-emerald-800 text-lg mb-1">Pending Investor Final Approval</h3>
                                    <p className="text-emerald-600 text-sm mb-4">{isStudent ? 'Student Founder' : 'Startup'} has accepted the Counter Offer.</p>
                                    
                                    {amIStartup ? (
                                        <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" /> Waiting for Investor Final Approval...
                                        </p>
                                    ) : (
                                        <button onClick={() => setShowProceedDialog(true)} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                                            Proceed to Smart Agreement
                                        </button>
                                    )}
                                </div>
                                <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="size-6 text-emerald-600" />
                                </div>
                            </div>
                        )}
                        {isLocked && (
                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between mt-6">
                                <div>
                                    <h3 className="font-bold text-emerald-800 text-lg mb-1">Phase 5 Unlocked</h3>
                                    <p className="text-emerald-600 text-sm">The negotiation has been locked and the Smart Agreement phase is now available.</p>
                                </div>
                                <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Lock className="size-6 text-emerald-600" />
                                </div>
                            </div>
                        )}
                        {isRejected && (
                            <div className="bg-red-50 rounded-2xl p-6 border border-red-100 flex items-center justify-between mt-6">
                                <div>
                                    <h3 className="font-bold text-red-800 text-lg mb-1">Negotiation Rejected</h3>
                                    <p className="text-red-600 text-sm">The negotiation has ended and the Deal Room is closed.</p>
                                </div>
                                {rejectedByMe && (
                                    <button 
                                        onClick={handleContinueNegotiation} 
                                        disabled={submitting}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="animate-spin size-4 mx-auto" /> : "Continue Negotiation"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Discussion, History, Calculator */}
                <div className="space-y-6">
                    {/* Discussion */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-80">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MessageSquare className="size-4 text-blue-500" /> Discussion
                            </h3>
                            <button className="text-xs text-blue-600 font-medium">View All</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {discussions.map((msg) => {
                                const amISender = (amIStartup && msg.sender_type === 'startup') || (!amIStartup && msg.sender_type === 'investor');
                                return (
                                    <div key={msg.id} className="flex gap-2 text-sm group">
                                        <div className="size-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                            {amISender ? "Y" : (msg.sender_type === 'startup' ? "F" : "I")}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-800">{amISender ? "You" : (msg.sender_type === 'startup' ? (isStudent ? "Student Founder" : "Startup") : "Investor")}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {msg.is_edited && <span className="text-[9px] text-slate-400 italic">(edited)</span>}
                                                </div>
                                                {amISender && !msg.is_deleted && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingMessageId(msg.id); setMessageInput(msg.message); }} className="text-slate-400 hover:text-blue-500"><Edit2 className="size-3" /></button>
                                                        <button onClick={() => deleteMessage(msg.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="size-3" /></button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className={`p-2 rounded-xl rounded-tl-none ${msg.is_deleted ? 'bg-slate-50 text-slate-400 italic' : 'bg-blue-50 text-slate-700'}`}>
                                                {msg.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex gap-2 shrink-0">
                            <input 
                                type="text" 
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Send className="size-4" />
                            </button>
                        </form>
                    </div>

                    {/* Version History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <History className="size-4 text-indigo-500" /> Version History
                            </h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {versions.map((v, i) => (
                                <div key={v.id} className="flex gap-3 items-center">
                                    <div className="size-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                        v{v.version_number}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {v.action === 'Initial Offer' ? (isStudent ? 'Student Founder Initial Offer' : 'Startup Initial Offer') : 
                                             v.action === 'Counter Offer' ? `Counter Offer by ${v.proposed_by_type === 'startup' ? (isStudent ? 'Student Founder' : 'Startup') : 'Investor'}` :
                                             v.action === 'Accepted' ? `Accepted by ${v.proposed_by_type === 'startup' ? (isStudent ? 'Student Founder' : 'Startup') : 'Investor'}` :
                                             v.action === 'Rejected' ? `Rejected by ${v.proposed_by_type === 'startup' ? (isStudent ? 'Student Founder' : 'Startup') : 'Investor'}` :
                                             (v.proposed_by_type === 'startup' ? "Counter Offer by Founder" : "Counter Offer by Investor")}
                                        </p>
                                        <p className="text-xs text-slate-400">{new Date(v.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                    {v.status === 'Current' && (
                                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold">Current</span>
                                    )}
                                </div>
                            ))}
                            {versions.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No history yet.</p>}
                        </div>
                    </div>

                    {/* Deal Calculator */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <PieChart className="size-4 text-purple-500" /> Deal Calculator (v{versions.length || 1})
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="size-24 shrink-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie data={dataForChart} innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                                            {dataForChart.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </RechartsPie>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col text-[8px] font-bold text-slate-600 leading-tight text-center">
                                    Post-money
                                    <span className="text-[10px] text-slate-800">₹ {(dynamicValuation / 10000000).toFixed(2)}Cr</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full bg-[#34d399]" />
                                        <span className="text-slate-600 font-medium">Founder Equity</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{100 - (editTerms.equity || 0)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full bg-[#6366f1]" />
                                        <span className="text-slate-600 font-medium">Investor Equity</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{editTerms.equity || 0}%</span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Total Equity</span>
                                    <span className="font-bold text-slate-800">100%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proceed to Smart Agreement Dialog */}
            {showProceedDialog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Lock className="size-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Proceed to Smart Agreement</h3>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Do you want to lock the negotiation and proceed to the Smart Agreement phase?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowProceedDialog(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                            >
                                No
                            </button>
                            <button 
                                onClick={() => {
                                    setShowProceedDialog(false);
                                    handleLock();
                                }}
                                disabled={submitting}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Offer Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-t-4 border-red-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="size-5 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Reject Offer</h3>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Are you sure you want to reject this offer? This will end the current negotiation phase.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowRejectDialog(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeReject}
                                disabled={submitting}
                                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Rejecting..." : "Yes, Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
