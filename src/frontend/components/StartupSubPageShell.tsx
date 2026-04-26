"use client";

import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";

/** Fullscreen centered loading spinner wrapper */
export function PageLoading({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">{children}</div>
        </div>
    );
}

/** Fullscreen centered error message */
export function PageError({ message }: { message: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center text-red-400 font-bold">
            <XCircle className="w-6 h-6 mr-2" />{message}
        </div>
    );
}

interface SubPageHeaderProps {
    id: string;
    badgeIcon: React.ReactNode;
    badgeLabel: string;
    badgeColorClasses: string; // e.g. "text-emerald-600 bg-emerald-900/30 border-emerald-500/20"
    startupName?: string;
    startupSector?: string;
}

/** Back-link + badge + h1 + sector — identical across all AI sub-pages */
export function SubPageHeader({
    id, badgeIcon, badgeLabel, badgeColorClasses, startupName, startupSector,
}: SubPageHeaderProps) {
    return (
        <div className="mb-10">
            <Link
                href={`/startups/${id}`}
                className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 text-sm mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>
            <div className="flex items-center gap-3 mb-2">
                {badgeIcon}
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${badgeColorClasses}`}>
                    {badgeLabel}
                </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{startupName}</h1>
            <p className="text-slate-500 mt-1">{startupSector}</p>
        </div>
    );
}

interface ScoreRingProps {
    score: number;          // 0-100
    stroke: string;         // CSS color string e.g. "#10b981"
    label: string | number; // displayed inside ring
    sublabel?: string;      // displayed below label, defaults to "/ 100"
}

/** Reusable circular score ring (SVG) used in Trust, Compliance, Due-Diligence */
export function ScoreRing({ score, stroke, label, sublabel = "/ 100" }: ScoreRingProps) {
    return (
        <div className="relative w-44 h-44 shrink-0">
            <svg className="w-full h-full -rotate-90">
                <circle cx="88" cy="88" r="78" strokeWidth="10" fill="transparent" stroke="#27272a" />
                <circle
                    cx="88" cy="88" r="78" strokeWidth="10" fill="transparent"
                    strokeDasharray="490"
                    strokeDashoffset={490 - (490 * score) / 100}
                    stroke={stroke}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-900">{label}</span>
                <span className="text-sm font-bold text-slate-400">{sublabel}</span>
            </div>
        </div>
    );
}
