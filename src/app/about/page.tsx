"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";

/**
 * Renders the About page hero section with venture capital messaging, email signup CTAs, and illustrative dashboard/startup mockups.
 * @example
 * AboutPage()
 * <AboutPage />
 * @returns {JSX.Element} The About page React component.
 */
export default function AboutPage() {
    return (
        <div className="bg-white min-h-screen text-slate-900 font-sans overflow-hidden">

            {/* Hero Section */}
            <div className="container mx-auto px-6 pt-32 pb-16 lg:h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center justify-between gap-12 relative">

                {/* Left Column - Copy & CTA */}
                <div className="lg:w-1/2 z-10 space-y-8 animate-fade-in-up">
                    <h1 className="text-5xl lg:text-7xl font-outfit font-bold tracking-tight text-slate-950 leading-[1.1]">
                        Unlock Exclusive <br /> Venture Capital
                    </h1>

                    <p className="text-sm font-bold tracking-[0.2em] text-indigo-600 uppercase">
                        VERIFIED, SECURE & DATA-DRIVEN
                    </p>

                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 pt-4 pb-8">
                        <div>
                            <div>
                                <p className="text-5xl font-outfit font-black text-slate-900 flex items-baseline">
                                    10<span className="text-indigo-600">x</span>
                                </p>
                                <p className="text-sm text-slate-500 font-medium mt-1">Faster Deal <br />Origination</p>
                            </div>            </div>
                        <div>
                            <p className="text-5xl font-outfit font-black text-slate-900 flex items-baseline">
                                100<span className="text-pink-600">%</span>
                            </p>
                            <p className="text-sm text-slate-500 font-medium mt-1">Verified Real <br />Startups & Investors</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 max-w-xl">
                        <div className="flex items-center w-full bg-white border border-slate-300 rounded-full px-4 py-3 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.1)] focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="text-slate-400 mr-2 shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                            </span>
                            <input type="email" placeholder="Enter your work email" className="w-full bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400" />
                        </div>
                        <Link href="/register" className="w-full sm:w-auto shrink-0 bg-[#5e35b1] hover:bg-[#4527a0] text-white px-8 py-3.5 rounded-full font-bold transition-all whitespace-nowrap text-center shadow-lg shadow-indigo-900/20">
                            Join InVolution Network
                        </Link>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">By continuing, I accept InVolution's <a href="#" className="underline text-indigo-500">T&C and Privacy policy</a></p>
                </div>

                {/* Right Column - Mockups Inspired by Upstox Phone Layout */}
                <div className="lg:w-1/2 relative h-[500px] lg:size-full flex items-center justify-center lg:justify-end">
                    {/* Decorative Background Blob */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-100 to-pink-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    {/* Front Phone / Card - Dashboard Mockup */}
                    <div className="absolute right-10 lg:right-24 top-20 lg:top-auto z-30 w-72 h-[550px] bg-slate-950 rounded-[40px] border-[12px] border-slate-900 shadow-2xl overflow-hidden  rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="bg-slate-900 h-full p-6 text-white relative">
                            <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 rounded-b-3xl"></div> {/* Notch */}

                            <div className="mt-8 flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <Image src="/logo.svg" alt="InVolution Logo" width={24} height={24} className="size-6 object-contain" />
                                    <span className="font-bold text-sm">Portfolio</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 text-slate-900 mb-6 shadow-sm">
                                <p className="text-xs text-slate-500 font-medium mb-1">Total Capital Deployed</p>
                                <p className="text-2xl font-bold font-mono">₹ 1.5 Cr <span className="text-green-500 text-sm ml-2">↑ 12%</span></p>
                            </div>

                            {/* Chart Mockup */}
                            <div className="h-32 w-full mt-4 relative">
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
                                    <path d="M0,80 L10,75 L20,85 L30,40 L40,60 L50,20 L60,30 L70,10 L80,35 L90,15 L100,5" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className="mt-6 flex justify-between px-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <span>1D</span> <span>1W</span> <span className="text-white bg-slate-800 px-2 py-1 rounded-full">1M</span> <span>1Y</span> <span>ALL</span>
                            </div>
                        </div>
                    </div>

                    {/* Back Phone / Card - Startup List Mockup */}
                    <div className="absolute right-40 lg:right-64 top-40 lg:top-32 z-20 w-72 h-[550px] bg-slate-50 rounded-[40px] border-[12px] border-white shadow-[-20px_20px_40px_rgba(0,0,0,0.1)] overflow-hidden  -rotate-6 hover:-rotate-2 transition-transform duration-500">
                        <div className="bg-slate-50 h-full p-4 relative pt-12">
                            <div className="absolute top-0 inset-x-0 h-6 bg-white rounded-b-3xl"></div> {/* Notch */}

                            <div className="bg-slate-200/50 rounded-full px-4 py-2 flex items-center gap-2 mb-6">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <span className="text-xs text-slate-500">Search AI Startups...</span>
                            </div>

                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <div className="flex gap-3">
                                            <div className={`size-10 rounded-lg flex items-center justify-center font-bold text-white ${i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-pink-500' : 'bg-emerald-500'}`}>
                                                {i === 1 ? 'H' : i === 2 ? 'E' : 'N'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{i === 1 ? 'HealthSync' : i === 2 ? 'EcoGrid' : 'NovaAI'}</p>
                                                <p className="text-[10px] text-slate-500">{i === 1 ? 'AI Diagnostics' : i === 2 ? 'Clean Energy' : 'Enterprise SaaS'}</p>
                                            </div>
                                        </div>
                                        <div className="text-green-500 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">9{9 - i}% Match</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky CTA Banner */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] py-4 px-6 z-50  translate-y-0 transition-transform duration-300 print:hidden hidden md:block">
                <div className="container mx-auto flex items-center justify-between max-w-6xl">
                    <h3 className="text-xl font-bold font-outfit text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="size-6 text-indigo-600" />
                        Enjoy Secure KYC, Deal Rooms and Smart Contracts
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center w-64 bg-slate-50 border border-slate-300 rounded-full px-4 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="text-slate-400 mr-2 text-xs font-bold font-mono">Mail</span>
                            <input type="email" placeholder="john@vc.com" className="w-full bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400" />
                        </div>
                        <Link href="/register" className="bg-[#5e35b1] hover:bg-[#4527a0] text-white px-6 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap text-sm shadow-md">
                            Open FREE Deal Room
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
