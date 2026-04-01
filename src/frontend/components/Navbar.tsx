"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session, status } = useSession();
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="font-outfit text-lg font-bold tracking-tight flex items-center gap-2.5 text-slate-900">
                    <Image src="/logo.svg" alt="InVolution Logo" width={30} height={30} className="w-7 h-7 object-contain" />
                    <span>InVolution</span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
                    <Link href="/about" className="hover:text-emerald-700 transition-colors">About</Link>

                    {status === "authenticated" ? (
                        (session?.user as any)?.role === "investor" ? (
                            <Link href="/investors/dashboard" className="hover:text-emerald-700 transition-colors">Portfolio</Link>
                        ) : (
                            <Link href="/startups/dashboard" className="hover:text-emerald-700 transition-colors">Dashboard</Link>
                        )
                    ) : (
                        <>
                            <Link href="/startups" className="hover:text-emerald-700 transition-colors">Startups</Link>
                            <Link href="/investors" className="hover:text-emerald-700 transition-colors">Investors</Link>
                        </>
                    )}

                    <Link href="/rules" className="hover:text-emerald-700 transition-colors">Rules & FAQ</Link>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {status === "authenticated" ? (
                        <>
                            <Link
                                href={(session?.user as any)?.role === "investor" ? "/investors/search" : "/startups/dashboard"}
                                className="hidden md:block text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                            >
                                {(session?.user as any)?.role === "investor" ? "Discover" : "Dashboard"}
                            </Link>
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                                <img src={session.user?.image || ""} alt="Avatar" className="w-7 h-7 rounded-full border-2 border-emerald-200 shadow-sm" />
                                <button onClick={() => signOut()} className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors">
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
                                Login
                            </Link>
                            <Link href="/login" className="text-sm font-semibold bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition-colors shadow-sm">
                                Investor Portal
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
