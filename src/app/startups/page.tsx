import Link from "next/link";
import { ArrowRight, Activity, BarChart2, ShieldCheck, TrendingUp } from "lucide-react";

/**
 * Renders the startups landing page for founders, highlighting verification, fundraising acceleration, and key trust/growth metrics.
 * @example
 * StartupsPage()
 * <StartupsPage />
 * @returns {JSX.Element} The startups page UI.
 **/
export default function StartupsPage() {
    return (
        <div className="min-h-screen section-emerald relative overflow-hidden">
            {/* Dot grid */}
            <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-emerald-200/30 blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-28 max-w-3xl mx-auto">
                <div className="section-label mx-auto mb-8">
                    <Activity className="size-3.5" /> For Startup Founders
                </div>
                <h1 className="text-4xl md:text-6xl font-outfit font-bold text-slate-900 mb-4 leading-tight">
                    Your Startup. <span className="text-gradient">Verified.</span><br />
                    Your Raise. <span className="text-gradient">Accelerated.</span>
                </h1>
                <span className="block divider-emerald mx-auto my-5" />
                <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl">
                    Get in front of verified, active investors. Publish your profile, set your terms, and let our AI match you with the capital you need to scale.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
                    <Link href="/startups/publish" className="btn-primary inline-flex items-center gap-2 text-sm">
                        Publish Profile <ArrowRight className="size-4" />
                    </Link>
                    <Link href="/login" className="btn-secondary inline-block text-sm">
                        Log In
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                    {[
                        { icon: <BarChart2 className="size-4 text-emerald-600" />, label: 'AI Diligence Score', value: '88/100' },
                        { icon: <ShieldCheck className="size-4 text-emerald-600" />, label: 'Trust Tier', value: 'PLATINUM' },
                        { icon: <Activity className="size-4 text-emerald-600" />, label: 'Health Score', value: '98/100' },
                        { icon: <TrendingUp className="size-4 text-emerald-600" />, label: 'Growth Rate', value: '+12% MoM' },
                    ].map((c, i) => (
                        <div key={i} className="dashboard-card p-4 text-left">
                            <div className="flex items-center gap-1.5 mb-2">{c.icon}<span className="text-[11px] text-slate-400 font-medium">{c.label}</span></div>
                            <p className="text-base font-bold text-slate-800 metric-value">{c.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
