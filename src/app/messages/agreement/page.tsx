"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

/**
 * Renders a printable investment contract agreement page populated from URL query parameters.
 * @example
 * AgreementContent()
 * JSX.Element
 * @param {void} - This component does not accept any parameters.
 * @returns {JSX.Element} A React component that displays the investment agreement and supports printing.
 **/
function AgreementContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const startupName = searchParams.get('startup') || "HealthSync Inc.";
    const amount = searchParams.get('amount') || "₹ 50,00,000";
    const equity = searchParams.get('equity') || "10.0%";
    const investorSignature = searchParams.get('signature') || "";
    const startupSignature = searchParams.get('startupSig') || "Auto-Signed via Smart Contract";
    const companyAddress = searchParams.get('cAddress') || "123 Tech Lane, BLR";
    const investorAddress = searchParams.get('iAddress') || "_________________________";
    const paymentMethod = searchParams.get('payment') || "wire transfer";
    const investmentPeriod = searchParams.get('period') || "5";
    const executives = searchParams.get('execs') || "";
    const board = searchParams.get('board') || "";

    const execList = executives ? executives.split(',').map(e => e.trim()) : [];
    const boardList = board ? board.split(',').map(e => e.trim()) : [];

    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 text-black font-serif pb-12">
            {/* Non-printable action bar */}
            <div className="print:hidden bg-slate-50 text-slate-900 p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="size-5" /> Back to Deal Room
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-slate-900 font-semibold rounded-lg transition-colors"
                >
                    <Printer className="size-4" /> Print / Save as PDF
                </button>
            </div>

            {/* Printable Document Area */}
            <div className="max-w-[850px] mx-auto p-12 bg-white mt-8 print:mt-0 print:p-8 shadow-xl print:shadow-none min-h-[1100px] text-sm md:text-base">

                <div className="text-left mb-6">
                    <p>State of ____________</p>
                </div>

                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold uppercase underline underline-offset-4">Investment Contractual Agreement</h1>
                </div>

                {/* Body */}
                <div className="space-y-6 leading-relaxed text-justify text-[15px]">

                    <div>
                        <h2 className="font-bold underline uppercase mb-3 text-[16px]">Parties</h2>
                        <div className="pl-4 flex items-start gap-2">
                            <span>-</span>
                            <p>
                                This Investment Contractual Agreement (hereinafter referred to as the <strong>"Agreement"</strong>) is
                                entered into on <span className="border-b border-black px-4 inline-block min-w-[120px] text-center">{month} {day}, {year}</span> (the <strong>"Effective Date"</strong>), by and between
                                <span className="border-b border-black px-4 inline-block min-w-[200px] text-center font-bold mx-2">{investorSignature || "_______________________"}</span>, with an address of
                                <span className="border-b border-black px-4 inline-block min-w-[200px] text-center mx-2">{investorAddress}</span> (hereinafter referred
                                to as the <strong>"Investor"</strong>) and <span className="border-b border-black px-4 inline-block min-w-[200px] text-center font-bold mx-2">{startupName}</span> with an address of
                                <span className="border-b border-black px-4 inline-block min-w-[200px] text-center mx-2">{companyAddress}</span>
                                (hereinafter referred to as the <strong>"Company"</strong>) (collectively referred to as the <strong>"Parties"</strong>).
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold underline uppercase mb-3 text-[16px]">Investment</h2>
                        <p>
                            The Parties agree that the Investor will invest <span className="border-b border-black px-4 inline-block min-w-[150px] text-center font-bold mx-1">{amount}</span> in exchange for
                            <span className="border-b border-black px-4 inline-block min-w-[150px] text-center font-bold mx-1">{equity}</span> Company's shares.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-bold underline uppercase mb-3 text-[16px]">Investment Payment</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-2">
                                <span>-</span>
                                <p>
                                    The Parties agree that the Investor will pay the investment amount via the method of
                                    <span className="border-b border-black px-4 inline-block min-w-[150px] text-center mx-1">{paymentMethod}</span> (check/ wire transfer) upon signing this Agreement.
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span>-</span>
                                <p>
                                    The Parties agree that the Investor will pay the investment amount on a
                                    <span className="border-b border-black px-4 inline-block min-w-[150px] text-center mx-1">one time</span>
                                    basis (one time/ recurring). In case the Parties agree that the Investor pays the investment
                                    amount on a recurring basis, the Investor will be obliged to pay an investment amount of
                                    <span className="border-b border-black px-4 inline-block min-w-[150px] text-center mx-1">______________</span> per year for a period of <span className="border-b border-black px-4 inline-block min-w-[150px] text-center mx-1">______________</span> years. This will be done in
                                    exchange for <span className="border-b border-black px-4 inline-block min-w-[150px] text-center mx-1">______________</span> shares in the Company.
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span>-</span>
                                <p>
                                    The Parties agree that the investment period will be over at least <span className="border-b border-black px-4 inline-block min-w-[120px] text-center mx-1">{investmentPeriod}</span> years
                                    in which it will not be withdrawn.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold underline uppercase mb-3 text-[16px]">Management and Control</h2>
                        <div className="pl-4 flex items-start gap-2 mb-4">
                            <span>-</span>
                            <p>The Parties agree that the Company will be managed by the following:</p>
                        </div>

                        <div className="pl-4 space-y-4">
                            <div>
                                <p className="mb-2">Executives:</p>
                                <ol className="list-decimal pl-8 space-y-1">
                                    <li><span className="border-b border-black px-2 inline-block min-w-[150px]">{execList[0] || "__________________"}</span></li>
                                    <li><span className="border-b border-black px-2 inline-block min-w-[150px]">{execList[1] || "__________________"}</span></li>
                                    <li><span className="border-b border-black px-2 inline-block min-w-[150px]">{execList[2] || "__________________"}</span></li>
                                </ol>
                            </div>
                            <div>
                                <p className="mb-2">Board of Directors:</p>
                                <ol className="list-decimal pl-8 space-y-1">
                                    <li><span className="border-b border-black px-2 inline-block min-w-[150px]">{boardList[0] || "__________________"}</span></li>
                                    <li><span className="border-b border-black px-2 inline-block min-w-[150px]">{boardList[1] || "__________________"}</span></li>
                                    <li><span className="border-b border-black px-2 inline-block min-w-[150px]">{boardList[2] || "__________________"}</span></li>
                                </ol>
                            </div>

                            <p className="mt-4">Whereas the aforementioned has been determined by the Company's majority shareholder.</p>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-16 grid grid-cols-2 gap-12">
                    {/* Startup Signature */}
                    <div className="space-y-6">
                        <div className="flex items-end">
                            <span className="w-8 shrink-0">By:</span>
                            <div className="border-b border-black grow h-8 flex items-end pb-1 text-indigo-900 font-serif italic text-2xl">
                                {startupSignature}
                            </div>
                        </div>
                        <div className="flex items-end">
                            <span className="w-20 shrink-0 text-sm">Print Name:</span>
                            <div className="border-b border-black grow h-6 flex items-end pb-1 font-bold">
                                {startupName}
                            </div>
                        </div>
                        <div className="flex items-end">
                            <span className="w-12 shrink-0 text-sm">Title:</span>
                            <div className="border-b border-black grow h-6 flex items-end pb-1">
                                Authorized Signatory
                            </div>
                        </div>
                    </div>

                    {/* Investor Signature */}
                    <div className="space-y-6">
                        <div className="flex items-end">
                            <span className="w-8 shrink-0">By:</span>
                            <div className="border-b border-black grow h-8 flex items-end pb-1 text-indigo-900 font-serif italic text-2xl">
                                {investorSignature}
                            </div>
                        </div>
                        <div className="flex items-end">
                            <span className="w-20 shrink-0 text-sm">Print Name:</span>
                            <div className="border-b border-black grow h-6 flex items-end pb-1 font-bold">
                                {investorSignature}
                            </div>
                        </div>
                        <div className="flex items-end">
                            <span className="w-12 shrink-0 text-sm">Title:</span>
                            <div className="border-b border-black grow h-6 flex items-end pb-1">
                                Investor
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function PrintableAgreement() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Agreement...</div>}>
            <AgreementContent />
        </Suspense>
    );
}
