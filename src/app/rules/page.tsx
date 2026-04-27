import Link from 'next/link';
import { ShieldAlert, FileWarning, Scale } from 'lucide-react';

/**
 * Renders the platform rules and liability FAQ page, presenting compliance guidance, liability disclaimers, and common questions about using the InVolution Deal Room.
 * @example
 * RulesFAQPage()
 * <RulesFAQPage />
 * @returns {JSX.Element} The complete rules and FAQ page UI.
 */
export default function RulesFAQPage() {
    return (
        <div className="min-h-screen bg-[#f8faf9]">
            <div className="container mx-auto px-6 py-24">
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                        <ShieldAlert className="size-4 text-emerald-600" />
                        <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase">Platform Policy</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-bold text-slate-900 mb-6">Platform Rules & Liability</h1>
                    <p className="text-xl text-slate-500 font-inter leading-relaxed">
                        To maintain a secure and legally compliant ecosystem, all users must adhere to the following strict guidelines when interacting, negotiating, and executing investment agreements.
                    </p>
                </div>

                {/* 3-Column Layout */}
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start mb-20">

                    {/* Column 1 */}
                    <div className="dashboard-card p-8 text-center flex flex-col items-center group h-full justify-center">
                        <div className="size-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mb-6 group-hover:bg-rose-100 transition-colors">
                            <FileWarning className="size-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-wide">On-Platform Agreements</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            All Non-Disclosure Agreements (NDAs) and Investment Contracts must be drafted and executed exclusively through the secure InVolution Deal Room.
                        </p>
                    </div>

                    {/* Column 2: Central Highlighted */}
                    <div className="p-10 rounded-2xl bg-emerald-600 border border-emerald-500 text-center flex flex-col items-center  scale-105 shadow-2xl shadow-emerald-500/20 relative z-10 h-full justify-center">
                        <div className="size-20 rounded-full bg-white/20 text-white flex items-center justify-center mb-6">
                            <ShieldAlert className="size-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">Zero Liability Policy</h3>
                        <p className="text-emerald-100 text-sm leading-relaxed mb-8">
                            InVolution holds absolutely <strong>zero liability</strong> for any negotiations, fund transfers, or agreements conducted outside of the platform. If you bypass our Deal Room, you forfeit all platform protections and dispute resolution protocols.
                        </p>
                        <Link href="/messages" className="px-8 py-3 bg-white text-emerald-700 font-bold rounded-full hover:bg-emerald-50 transition-colors shadow-lg uppercase tracking-wider text-sm">
                            Go to Deal Room
                        </Link>
                    </div>

                    {/* Column 3 */}
                    <div className="dashboard-card p-8 text-center flex flex-col items-center group h-full justify-center">
                        <div className="size-16 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-500 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                            <Scale className="size-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-wide">Legal Compliance</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            By using InVolution, you agree to our rigorous KYC/AML checks. Any attempt to supply fraudulent identities or bypass legal restrictions will result in immediate termination.
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto space-y-4">
                    <h2 className="text-3xl font-outfit font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>

                    {[
                        {
                            q: 'Can we wire funds directly without the Deal Room?',
                            a: 'Yes, the actual wire transfer occurs externally between your designated banks. However, the legally binding contract outlining that transfer MUST be signed via the InVolution Deal Room to activate our dispute resolution protections and formalize the investment record.',
                            color: 'text-emerald-600'
                        },
                        {
                            q: 'What happens if we sign a contract on paper off-platform?',
                            a: 'InVolution is completely indemnified and not responsible for any fraud, misrepresentation, or capital loss resulting from off-platform agreements. You will be entirely on your own without our legal audit trail.',
                            color: 'text-rose-600'
                        },
                        {
                            q: 'Why are my unexecuted messages masked?',
                            a: 'To protect the privacy of our users and enforce our On-Platform Agreement rules, Personally Identifiable Information (PII) such as phone numbers and email addresses are automatically masked in the Deal Room until an official Smart Contract is mutually executed.',
                            color: 'text-slate-600'
                        }
                    ].map((faq, i) => (
                        <div key={i} className="dashboard-card p-6">
                            <h4 className={`text-base font-bold ${faq.color} mb-2`}>{faq.q}</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
