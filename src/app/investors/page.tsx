"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, BarChart2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

function ScrollReveal({
    children,
    className,
    delay = 0,
    y = 18,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    y?: number;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut", delay }}
        >
            {children}
        </motion.div>
    );
}

/**
* Renders the investors landing page with a verified-startups marketing message, primary navigation actions, and key platform metrics.
* @example
* InvestorsPage()
* <div>...</div>
* @returns {JSX.Element} The investors page UI.
**/
export default function InvestorsPage() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 bg-[#f8faf9] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-50 rounded-full blur-[100px] opacity-70 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-emerald-100/30 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
                <ScrollReveal>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
                        <Zap className="size-4 text-emerald-600" />
                        <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase">For Investors</span>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                    <h1 className="text-4xl md:text-6xl font-outfit font-bold text-slate-900 mb-6 leading-tight">
                        Discover <span className="text-gradient">Verified</span> Startups. <br />
                        Close Deals <span className="text-gradient">Faster.</span>
                    </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                    <p className="text-xl text-slate-500 leading-relaxed mb-10">
                        Stop sifting through unverified pitch decks. Use our AI matchmaking engine to discover hyper-targeted, verified startup opportunities that match your portfolio risk and scope.
                    </p>
                </ScrollReveal>

                <ScrollReveal delay={0.15}>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link href="/investors/search" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-md hover:scale-105">
                            Go to AI Search <ArrowRight className="size-5" />
                        </Link>
                        <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 border border-slate-300 bg-white text-slate-700 font-semibold rounded-full hover:bg-slate-50 transition-all shadow-sm">
                            Log In
                        </Link>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Zap className="size-4 text-emerald-600" />, label: 'Match Accuracy', value: '99.9% AI' },
                        { icon: <ShieldCheck className="size-4 text-emerald-600" />, label: 'KYC Verified', value: '100%' },
                        { icon: <BarChart2 className="size-4 text-emerald-600" />, label: 'Avg Diligence', value: '88/100' },
                        { icon: <TrendingUp className="size-4 text-emerald-600" />, label: 'Deal Success Rate', value: '+24x' },
                    ].map((c, i) => (
                        <ScrollReveal key={i} delay={0.05 + i * 0.06}>
                            <div className="dashboard-card p-4 text-left">
                                <div className="flex items-center gap-2 mb-2">{c.icon}<span className="text-xs text-slate-400 font-medium">{c.label}</span></div>
                                <p className="text-lg font-bold text-slate-900 metric-value">{c.value}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </div>
    );
}
