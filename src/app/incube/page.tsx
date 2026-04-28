import Link from "next/link";
import { ArrowRight, GraduationCap, Lightbulb, Rocket, Target, ShieldCheck, Cpu, TrendingUp, Zap } from "lucide-react";

export default function IncubeInfoPage() {
    return (
        <div className="relative min-h-screen flex flex-col items-center py-24 bg-[#f8faf9] overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[100px] opacity-70 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 animate-fade-in-up max-w-5xl px-6 mx-auto w-full">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-8">
                        <GraduationCap className="size-4 text-blue-600" />
                        <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">InVolution Incube</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-outfit font-bold text-slate-900 mb-6 leading-tight">
                        The Launchpad for <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Student Visionaries.</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed max-w-3xl mx-auto">
                        A dedicated environment designed specifically for student entrepreneurs under the age of 24.
                        Publish your vision, get vetted by AI, and connect directly with strategic investors—no complex financial history required.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                        <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-md hover:scale-105">
                            Join as a Student <ArrowRight className="size-5" />
                        </Link>
                        <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-300 bg-white text-slate-700 font-semibold rounded-full hover:bg-slate-50 transition-all shadow-sm">
                            Invest in Incube Deals
                        </Link>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 mt-20">
                    {/* Why for Students */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-400"></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Rocket className="size-6 text-blue-600" /> For Student Founders
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="shrink-0 size-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <Target className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">Focus on Vision, Not Spreadsheets</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">Skip the mandatory 12-month MRR charts. Pitch your idea, your Minimum Viable Product (MVP), and your unique market angle.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 size-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <Cpu className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">AI-Powered Refinement</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">Interact with our AI intelligence suite to refine your pitch, uncover market risks, and structure your business model professionally.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 size-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <ShieldCheck className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">Professional Deal Flow</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">Enter real encrypted deal rooms, learn how to negotiate with actual verified investors, and execute smart agreements securely.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Why for Investors */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-400"></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Lightbulb className="size-6 text-indigo-600" /> For Angel Investors
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="shrink-0 size-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <TrendingUp className="size-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">Uncapped Upside & Alpha</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">Investing at the pure "Idea" or "Pre-seed" stage gives you the highest possible ROI. Access generational talent early.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 size-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <Zap className="size-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">High Equity, Low Capital</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">Student capital requirements are exceptionally low. Secure significant equity percentages for a fraction of traditional market costs.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 size-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <ShieldCheck className="size-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">AI De-risked Opportunities</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">Even without financial history, our AI Intelligence Suite evaluates the startup's market opportunity and competitive moat for you.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
