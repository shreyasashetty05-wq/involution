"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck, CreditCard, Banknote, Clock } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [agreement, setAgreement] = useState<any>(null);
    const [signature, setSignature] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Read-only fetched deal data
    const [deal, setDeal] = useState<any>(null);

    const isStartup = currentUserId === startupId;
    const isInvestor = currentUserId === investorId;

    useEffect(() => {
        const fetchAgreement = async () => {
            setLoading(true);
            try {
                // Fetch deal for summary
                const dealRes = await fetch(`/api/deals?startupId=${startupId}&investorId=${investorId}`);
                if (dealRes.ok) {
                    const dealData = await dealRes.json();
                    if (dealData.success) {
                        setDeal(dealData.deal);
                    }
                }

                const res = await fetch(`/api/deals/smart-agreement?dealId=${dealId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.agreement) {
                        setAgreement(data.agreement);
                    } else if (!data.agreement && isStartup) {
                        // Startup can initialize it if it doesn't exist
                        handleAction('initialize');
                    }
                }
            } catch (err) {
                console.error("Failed to fetch smart agreement:", err);
            } finally {
                setLoading(false);
            }
        };

        if (dealId) {
            fetchAgreement();
        }
    }, [dealId, startupId, investorId, isStartup]);

    const handleAction = async (action: string) => {
        if (action === 'sign' && signature.trim().length < 3) {
            toast.warning("Please type your full legal name as signature.");
            return;
        }

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
                    signature: action === 'sign' ? signature : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                setAgreement(data.agreement);
                toast.success("Success!");
                if (action === 'confirm_received') {
                    // Force page reload or state update to reflect Deal Completed if necessary
                    // (Actually the main page polls for deal updates)
                }
            } else {
                toast.error(data.error || "Action failed");
            }
        } catch (err) {
            console.error("Action error:", err);
            toast.error("An error occurred");
        } finally {
            setActionLoading(false);
            setSignature("");
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="size-8 animate-spin text-pink-500" />
            </div>
        );
    }

    if (!agreement) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center text-slate-500 max-w-sm">
                    <ShieldCheck className="size-12 text-slate-300 mx-auto mb-4" />
                    <p>The Smart Agreement has not been initialized yet.</p>
                    {isStartup && (
                        <button onClick={() => handleAction('initialize')} className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                            Initialize Agreement
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Determine current step
    // Steps: 
    // 1. Signatures (status: Smart Agreement Started, Founder Signed, Investor Signed)
    // 2. Payment Details & Confirmation (status: Signatures Completed, Investor Payment Confirmed)
    // 3. Deal Completed (status: Deal Completed)

    const signaturesComplete = agreement.status === 'Signatures Completed' || agreement.status === 'Investor Payment Confirmed' || agreement.status === 'Payment Completed' || agreement.status === 'Deal Completed';
    const isDealCompleted = agreement.status === 'Deal Completed';

    const amISigned = isStartup ? !!agreement.founder_signature : !!agreement.investor_signature;
    const isOtherSigned = isStartup ? !!agreement.investor_signature : !!agreement.founder_signature;

    return (
        <div className="p-6 flex flex-col lg:flex-row gap-8 overflow-y-auto bg-slate-50 h-full">
            {/* Left Column: Summary & Status Timeline */}
            <div className="lg:w-1/2 space-y-6">
                <div className="flex items-center gap-2 text-pink-600 mb-1">
                    <ShieldCheck className="size-6" />
                    <h2 className="text-xl font-bold">Smart Agreement</h2>
                </div>
                <p className="text-sm text-slate-500 border-b border-slate-200 pb-4">
                    Review final terms, securely sign, and complete the investment payment.
                </p>

                {deal && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Final Agreed Terms</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Investment Amount</p>
                                <p className="font-semibold text-slate-800 text-lg">{deal.termAmount}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Equity Offered</p>
                                <p className="font-semibold text-slate-800 text-lg">{deal.termEquity}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Payment Method</p>
                                <p className="font-medium text-slate-700">{deal.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Investment Period</p>
                                <p className="font-medium text-slate-700">{deal.investmentPeriod} Years</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Workflow Status Timeline */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Workflow Status</h3>
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 ${signaturesComplete ? 'opacity-50' : ''}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${signaturesComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                                {signaturesComplete ? <CheckCircle2 className="size-4" /> : <FileText className="size-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">1. Digital Signatures</p>
                                <p className="text-xs text-slate-500">
                                    {signaturesComplete ? "Both parties have signed." : "Waiting for both parties to sign."}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 ${!signaturesComplete ? 'opacity-30 grayscale' : isDealCompleted ? 'opacity-50' : ''}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isDealCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                                {isDealCompleted ? <CheckCircle2 className="size-4" /> : <CreditCard className="size-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">2. Payment Processing</p>
                                <p className="text-xs text-slate-500">
                                    {agreement.investor_payment_confirmed ? 
                                        (agreement.startup_payment_received ? "Payment completed." : "Investor sent payment. Waiting for Startup confirmation.") 
                                        : "Waiting for Investor to send payment."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Actions */}
            <div className="lg:w-1/2 flex flex-col gap-5">
                {!signaturesComplete && (
                    <div className="bg-white border border-pink-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 size-24 bg-pink-50 rounded-bl-full -z-0" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2 relative z-10">Step 1: Digital Signature</h3>
                        <p className="text-sm text-slate-600 mb-6 relative z-10">
                            By signing below, you agree to the final terms and are legally bound to proceed with the investment transaction.
                        </p>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{isStartup ? investorName : startupName}</span>
                                {isOtherSigned ? (
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3.5" /> Signed</span>
                                ) : (
                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Clock className="size-3.5" /> Pending</span>
                                )}
                            </div>
                            
                            <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-100">
                                {amISigned ? (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 className="size-5" />
                                        <span className="font-semibold text-sm">You have signed. Waiting for the other party.</span>
                                    </div>
                                ) : (
                                    <>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Your Signature (Type full legal name)</label>
                                        <input 
                                            type="text" 
                                            placeholder="John Doe..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-pink-400 outline-none font-serif italic shadow-sm"
                                            value={signature} 
                                            onChange={e => setSignature(e.target.value)} 
                                        />
                                        <button 
                                            onClick={() => handleAction('sign')}
                                            disabled={actionLoading || signature.length < 3}
                                            className="w-full py-3 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl disabled:opacity-40 transition-all flex justify-center items-center gap-2 shadow-md hover:shadow-lg">
                                            {actionLoading ? <Loader2 className="size-5 animate-spin" /> : "Sign & Lock Terms"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {signaturesComplete && !isDealCompleted && (
                    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                            <Banknote className="size-6" />
                            <h3 className="text-lg font-bold">Step 2: Payment Execution</h3>
                        </div>
                        
                        {isInvestor && !agreement.investor_payment_confirmed && (
                            <div className="mt-4">
                                <p className="text-sm text-slate-600 mb-4">
                                    Please transfer the agreed investment amount to the startup's bank/UPI account offline.
                                    Once completed, click the button below to confirm the transfer.
                                </p>
                                <button 
                                    onClick={() => handleAction('confirm_sent')}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-md transition-all"
                                >
                                    {actionLoading ? <Loader2 className="size-5 animate-spin" /> : "I Have Transferred the Funds"}
                                </button>
                            </div>
                        )}

                        {isInvestor && agreement.investor_payment_confirmed && (
                            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-emerald-800 text-sm">Payment Confirmed</p>
                                    <p className="text-xs text-emerald-600 mt-1">Waiting for the startup to confirm receipt of funds.</p>
                                </div>
                            </div>
                        )}

                        {isStartup && !agreement.investor_payment_confirmed && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-sm text-amber-800">
                                    Waiting for the investor to transfer the investment funds to your provided payment details.
                                </p>
                            </div>
                        )}

                        {isStartup && agreement.investor_payment_confirmed && (
                            <div className="mt-4">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                                    <p className="text-sm text-blue-800 font-medium">
                                        The investor has confirmed the funds transfer. Please check your bank account.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleAction('confirm_received')}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-md transition-all"
                                >
                                    {actionLoading ? <Loader2 className="size-5 animate-spin" /> : "I Confirm Receipt of Funds"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {isDealCompleted && (
                    <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center shadow-sm">
                        <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="size-8" />
                        </div>
                        <h3 className="text-emerald-800 font-bold text-2xl mb-2">Deal Executed Successfully!</h3>
                        <p className="text-sm text-emerald-700 mb-6 border-b border-emerald-200 pb-6">
                            Congratulations! The investment round is finalized.
                        </p>
                        
                        {deal && (
                            <button
                                onClick={() => router.push(`/messages/agreement?success=true&startup=${encodeURIComponent(startupName)}&amount=${encodeURIComponent(deal.termAmount)}&equity=${encodeURIComponent(deal.termEquity)}&signature=${encodeURIComponent(agreement.investor_signature)}&startupSig=${encodeURIComponent(agreement.founder_signature)}&cAddress=${encodeURIComponent(deal.companyAddress)}&iAddress=${encodeURIComponent(deal.investorAddress)}&payment=${encodeURIComponent(deal.paymentMethod)}&period=${encodeURIComponent(deal.investmentPeriod)}&execs=${encodeURIComponent(deal.executives)}&board=${encodeURIComponent(deal.board)}`)}
                                className="w-full py-3 bg-white text-emerald-700 border border-emerald-200 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
                                <FileText className="size-4" /> View Official Term Sheet
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
