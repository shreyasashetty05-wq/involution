"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck, Lock, CheckCircle, Activity, User, ChevronRight, PenTool } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import SignatureCanvas from 'react-signature-canvas';

import { createClient } from "@/utils/supabase/client";

export function SmartAgreementTab({
    dealId,
    startupId,
    investorId,
    currentUserId,
    isStudent,
    startupName,
    investorName,
}: {
    dealId: string;
    startupId: string;
    investorId: string;
    currentUserId: string;
    isStudent: boolean;
    startupName: string;
    investorName: string;
}) {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [agreement, setAgreement] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deal, setDeal] = useState<any>(null);
    const [companyName, setCompanyName] = useState<string>("Loading...");
    const [fetchedFounderName, setFetchedFounderName] = useState<string>(startupName);
    const [fetchedInvestorName, setFetchedInvestorName] = useState<string>(investorName);

    const sigCanvas = useRef<SignatureCanvas>(null);

    const isInvestor = currentUserId === investorId;
    const isStartup = !isInvestor;

    const fetchAgreement = async () => {
        try {
            const dealRes = await fetch(`/api/deals?startupId=${startupId}&investorId=${investorId}`);
            if (dealRes.ok) {
                const dealData = await dealRes.json();
                if (dealData.success) {
                    setDeal(dealData.deal);
                }
            }

            // Fetch company and KYC names dynamically
            try {
                const supabase = createClient();
                
                // --- 1. Fetch Company Name & Founder Email ---
                let founderEmail = startupId;
                if (isStudent) {
                    const { data: incubeData } = await supabase.from('incubation_applications').select('project_name, owner_email').eq('id', startupId).maybeSingle();
                    setCompanyName(incubeData?.project_name || "N/A");
                    if (incubeData?.owner_email) founderEmail = incubeData.owner_email;
                } else {
                    if (startupId.includes('@')) {
                        const { data: startupData } = await supabase.from('startups').select('name, owner_email').eq('owner_email', startupId).maybeSingle();
                        setCompanyName(startupData?.name || "N/A");
                        if (startupData?.owner_email) founderEmail = startupData.owner_email;
                    } else {
                        const { data: startupData } = await supabase.from('startups').select('name, owner_email').eq('id', startupId).maybeSingle();
                        setCompanyName(startupData?.name || "N/A");
                        if (startupData?.owner_email) founderEmail = startupData.owner_email;
                    }
                }

                // --- 2. Fetch Investor Email ---
                let invEmail = investorId;
                if (!investorId.includes('@')) {
                    const { data: invData } = await supabase.from('investor_profiles').select('email').eq('id', investorId).maybeSingle();
                    if (invData?.email) invEmail = invData.email;
                }

                // --- 3. Fetch Permanent Names from KYC ---
                if (founderEmail) {
                    const { data: founderKyc } = await supabase.from('kyc_documents').select('name').eq('email', founderEmail).order('created_at', { ascending: false }).limit(1).maybeSingle();
                    // Override the passed startupName with KYC name
                    setFetchedFounderName(founderKyc?.name || startupName);
                }

                if (invEmail) {
                    const { data: invKyc } = await supabase.from('kyc_documents').select('name').eq('email', invEmail).order('created_at', { ascending: false }).limit(1).maybeSingle();
                    // Override the passed investorName with KYC name
                    setFetchedInvestorName(invKyc?.name || investorName);
                }
            } catch (e) {
                setCompanyName("N/A");
            }

            const res = await fetch(`/api/deals/smart-agreement?dealId=${dealId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.agreement) {
                    setAgreement(data.agreement);
                } else if (!data.agreement) {
                    handleAction('initialize');
                }
            }
        } catch (err) {
            console.error("Failed to fetch smart agreement:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dealId) {
            fetchAgreement();
        }
    }, [dealId, startupId, investorId]);

    // Polling for updates if waiting for the other party
    useEffect(() => {
        if (!agreement) return;
        const bothSigned = !!(agreement.founder_signature && agreement.investor_signature);
        if (!bothSigned) {
            const interval = setInterval(() => {
                fetchAgreement();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [agreement]);

    const handleAction = async (action: string, signatureDataUrl?: string) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/deals/smart-agreement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    action,
                    startupId,
                    investorId,
                    signature: signatureDataUrl
                })
            });
            const data = await res.json();
            if (data.success) {
                setAgreement(data.agreement);
                if (action !== 'initialize') toast.success("Success!");
            } else {
                if (action !== 'initialize') toast.error(data.error || "Action failed");
            }
        } catch (err) {
            console.error("Action error:", err);
            if (action !== 'initialize') toast.error("An error occurred");
        } finally {
            setActionLoading(false);
        }
    };

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const saveSignature = () => {
        if (sigCanvas.current?.isEmpty()) {
            toast.warning("Please provide your signature before saving.");
            return;
        }
        const dataUrl = sigCanvas.current?.getCanvas().toDataURL("image/png");
        if (dataUrl) {
            handleAction('sign', dataUrl);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="size-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!agreement) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="size-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-slate-500 font-medium">Initializing Smart Agreement...</span>
            </div>
        );
    }

    const founderSigned = !!agreement.founder_signature;
    const investorSigned = !!agreement.investor_signature;
    const signaturesComplete = founderSigned && investorSigned;

    // Timeline Steps logic
    const steps = [
        { name: "Negotiation Completed", status: "completed" },
        { name: "Agreement Summary", status: "completed" },
        { name: "Founder Signature", status: founderSigned ? "completed" : "current" },
        { name: "Investor Signature", status: investorSigned ? "completed" : (founderSigned ? "current" : "pending") },
        { name: "Payment Stage", status: "locked" },
        { name: "Agreement PDF", status: "locked" },
        { name: "Deal Completed", status: "locked" }
    ];

    const canISign = isStartup ? !founderSigned : (isInvestor && founderSigned && !investorSigned);
    const waitingForOther = isStartup ? (founderSigned && !investorSigned) : (isInvestor && !founderSigned);

    let computedValuation = 'N/A';
    if (deal && deal.termAmount && deal.termEquity) {
        const amountNum = parseFloat(String(deal.termAmount).replace(/[^0-9.]/g, ''));
        const equityNum = parseFloat(String(deal.termEquity).replace(/[^0-9.]/g, ''));
        if (amountNum && equityNum) {
            computedValuation = `₹ ${(amountNum / (equityNum / 100)).toLocaleString('en-IN')}`;
        }
    }

    return (
        <div className="p-6 overflow-y-auto bg-slate-50 min-h-full">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* 1. Agreement Progress Timeline */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-x-auto">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity className="size-5 text-indigo-600" />
                        Agreement Progress
                    </h3>
                    <div className="flex items-center min-w-[700px]">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex items-center">
                                <div className={`flex flex-col items-center justify-center relative z-10 w-24`}>
                                    <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                        step.status === 'completed' ? 'bg-indigo-600 border-indigo-600 text-white' : 
                                        step.status === 'current' ? 'bg-white border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' : 
                                        'bg-slate-100 border-slate-300 text-slate-400'
                                    }`}>
                                        {step.status === 'completed' ? <CheckCircle2 className="size-5" /> : 
                                         step.status === 'locked' ? <Lock className="size-4" /> : 
                                         <span className="text-xs font-bold">{idx + 1}</span>}
                                    </div>
                                    <span className={`text-[10px] mt-2 font-bold text-center leading-tight ${
                                        step.status === 'completed' ? 'text-indigo-700' : 
                                        step.status === 'current' ? 'text-slate-800' : 'text-slate-400'
                                    }`}>{step.name}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`h-1 w-12 -mx-4 z-0 ${step.status === 'completed' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Summary & Signatures */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 2. Agreement Summary */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText className="size-5 text-indigo-600" />
                                Agreement Summary
                            </h3>
                            {deal && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Founder Name</p>
                                        <p className="font-semibold text-slate-800">{fetchedFounderName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Investor Name</p>
                                        <p className="font-semibold text-slate-800">{fetchedInvestorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Company Name</p>
                                        <p className="font-semibold text-slate-800">{companyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Investment Amount</p>
                                        <p className="font-semibold text-slate-800">{deal.termAmount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Equity</p>
                                        <p className="font-semibold text-slate-800">{deal.termEquity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Valuation</p>
                                        <p className="font-medium text-slate-700">{deal.valuation || computedValuation}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Payment Method</p>
                                        <p className="font-medium text-slate-700">{deal.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Board Seat</p>
                                        <p className="font-medium text-slate-700">{deal.board || 'No'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Expected Closing</p>
                                        <p className="font-medium text-slate-700">{new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-3">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Additional Terms</p>
                                        <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            The investor shall transfer the funds within {deal.investmentPeriod || '1'} year(s). 
                                            Liquidation preference and anti-dilution rights are applied as per standard term sheet.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Phase 2 Payment Placeholder */}
                        {signaturesComplete && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
                                <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="size-8" />
                                </div>
                                <h3 className="text-emerald-800 font-bold text-2xl mb-2">Agreement Successfully Signed by Both Parties</h3>
                                <p className="text-sm text-emerald-700 font-medium">
                                    The payment stage will be implemented in Phase 2.
                                </p>
                            </div>
                        )}

                        {/* Signature Action Section */}
                        {!signaturesComplete && (
                            <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 size-32 bg-indigo-50 rounded-bl-full -z-0" />
                                <h3 className="text-lg font-bold text-slate-800 mb-1 relative z-10">
                                    {isStartup ? "Founder Signature" : "Investor Signature"}
                                </h3>
                                <p className="text-sm text-slate-600 mb-6 relative z-10 border-b border-slate-100 pb-4">
                                    Please read the agreement carefully. By signing below you agree to all finalized investment terms.
                                </p>
                                
                                <div className="relative z-10">
                                    {canISign ? (
                                        <div className="space-y-4">
                                            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white transition-colors">
                                                <SignatureCanvas 
                                                    ref={sigCanvas}
                                                    canvasProps={{className: 'w-full h-48 rounded-xl cursor-crosshair'}}
                                                    backgroundColor="transparent"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={clearSignature}
                                                    className="flex-1 py-3 bg-white text-slate-700 border border-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                                    Clear Signature
                                                </button>
                                                <button 
                                                    onClick={saveSignature}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                                                    {actionLoading ? <Loader2 className="size-5 animate-spin" /> : "Save Signature"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                            {waitingForOther ? (
                                                <>
                                                    <Loader2 className="size-8 text-indigo-400 animate-spin mb-3" />
                                                    <h4 className="font-bold text-slate-700">Waiting for {isStartup ? "Investor" : "Founder"} Signature...</h4>
                                                    <p className="text-xs text-slate-500 mt-1">They must sign the agreement before the deal can proceed.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="size-8 text-slate-300 mb-3" />
                                                    <h4 className="font-bold text-slate-700">Signature Locked</h4>
                                                    <p className="text-xs text-slate-500 mt-1">You cannot sign the agreement at this time.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Parties & Activity Log */}
                    <div className="space-y-6">
                        
                        {/* 3. Parties Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <User className="size-5 text-indigo-600" />
                                Parties
                            </h3>
                            <div className="space-y-4">
                                {/* Founder Status */}
                                <div className={`p-4 rounded-xl border ${founderSigned ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Founder</p>
                                    <p className="font-bold text-slate-800 mb-3">{startupName}</p>
                                    {founderSigned ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                <CheckCircle className="size-4" /> Founder Signed Successfully
                                            </div>
                                            <div className="bg-white border border-emerald-100 rounded p-2 text-center h-20 flex items-center justify-center">
                                                <img src={agreement.founder_signature} alt="Founder Signature" className="max-h-16 object-contain" />
                                            </div>
                                            <p className="text-[10px] text-emerald-700 text-right">
                                                {new Date(agreement.founder_signed_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                            <Loader2 className="size-3.5 animate-spin" /> Waiting for Signature
                                        </div>
                                    )}
                                </div>

                                {/* Investor Status */}
                                <div className={`p-4 rounded-xl border ${investorSigned ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Investor</p>
                                    <p className="font-bold text-slate-800 mb-3">{investorName}</p>
                                    {investorSigned ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                <CheckCircle className="size-4" /> Investor Signed Successfully
                                            </div>
                                            <div className="bg-white border border-emerald-100 rounded p-2 text-center h-20 flex items-center justify-center">
                                                <img src={agreement.investor_signature} alt="Investor Signature" className="max-h-16 object-contain" />
                                            </div>
                                            <p className="text-[10px] text-emerald-700 text-right">
                                                {new Date(agreement.investor_signed_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                            {founderSigned ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />} 
                                            {founderSigned ? "Waiting for Signature" : "Locked"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Activity Log */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <PenTool className="size-5 text-indigo-600" />
                                Activity Log
                            </h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {agreement.activity_log && agreement.activity_log.length > 0 ? (
                                    agreement.activity_log.map((log: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 text-sm">
                                            <div className="flex flex-col items-center">
                                                <div className="size-2 rounded-full bg-indigo-400 mt-1.5"></div>
                                                {idx < agreement.activity_log.length - 1 && <div className="w-px h-full bg-slate-200 mt-1"></div>}
                                            </div>
                                            <div className="pb-4">
                                                <p className="font-medium text-slate-800">{log.message}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{new Date(log.time).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">No activity yet.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
