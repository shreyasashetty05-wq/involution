"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

/**
* Renders the top navigation bar with branding, role-based links, and authentication actions.
* @example
* Navbar()
* <nav>...</nav>
* @param {undefined} Argument - This component does not take any arguments.
* @returns {JSX.Element} The rendered navigation bar component.
**/
export default function Navbar() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
    };

    const role = user?.user_metadata?.role || "investor";
    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
    const image = user?.user_metadata?.avatar_url || null;
    const isAuthenticated = !loading && !!user;

    return (
        <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="font-outfit text-lg font-bold tracking-tight flex items-center gap-2.5 text-slate-900">
                    <Image src="/logo.svg" alt="InVolution Logo" width={30} height={30} className="size-7 object-contain" />
                    <span>InVolution</span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
                    <Link href="/about" className="hover:text-emerald-700 transition-colors">About</Link>

                    {isAuthenticated ? (
                        role === "investor" ? (
                            <>
                                <Link href="/investors/dashboard" className="hover:text-emerald-700 transition-colors">Portfolio</Link>
                                <Link href="/investors/incube" className="hover:text-emerald-700 transition-colors">Incube</Link>
                            </>
                        ) : (
                            <Link href="/startups/dashboard" className="hover:text-emerald-700 transition-colors">Dashboard</Link>
                        )
                    ) : (
                        <>
                            <Link href="/startups" className="hover:text-emerald-700 transition-colors">Startups</Link>
                            <Link href="/investors" className="hover:text-emerald-700 transition-colors">Investors</Link>
                            <Link href="/incube" className="hover:text-emerald-700 transition-colors">Incube</Link>
                        </>
                    )}

                    <Link href="/rules" className="hover:text-emerald-700 transition-colors">Rules & FAQ</Link>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href={role === "investor" ? "/investors/search" : "/startups/dashboard"}
                                className="hidden md:block text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                            >
                                {role === "investor" ? "Discover" : "Dashboard"}
                            </Link>
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                                {image ? (
                                    <Image src={image} alt="Avatar" width={28} height={28} className="size-7 rounded-full border-2 border-emerald-200 shadow-sm" />
                                ) : (
                                    <div className="size-7 rounded-full border-2 border-emerald-200 shadow-sm bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                        {name?.charAt(0) || "U"}
                                    </div>
                                )}
                                <button onClick={handleSignOut} className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors">
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
