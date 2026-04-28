"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";

/**
 * Renders the registration page where users choose to sign up as a startup founder or investor and continue with Google authentication.
 * @example
 * RegisterPage()
 * JSX for the registration page
 * @param {never} Argument - This component does not accept any arguments.
 * @returns {JSX.Element} The registration page UI.
 **/
export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState<"startup" | "investor" | "student" | null>(null);

    const handleRegister = async (role: "startup" | "investor" | "student") => {
        setIsLoading(role);
        document.cookie = `involution_role=${role}; path=/; max-age=3600`;
        const dashboardRoute = role === "investor" ? "/investors/dashboard" : "/startups/dashboard";
        await signIn("google", { callbackUrl: dashboardRoute });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#f8faf9] overflow-hidden">
            {/* Soft bg blobs */}
            <div className="absolute top-0 left-0 size-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 size-[400px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="size-4" /> Back to Home
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10 text-center relative overflow-hidden">
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />

                    <div className="size-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <UserPlus className="size-8 text-emerald-600" />
                    </div>

                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Join InVolution</h1>
                    <p className="text-slate-500 text-sm mb-8 px-4">
                        Sign up with Google to create your account. KYC verification will follow after sign-up.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <button
                            onClick={() => handleRegister("startup")}
                            disabled={isLoading !== null}
                            className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all group disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                        >
                            {isLoading === "startup" && (
                                <div className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            )}
                            <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700">Founder</h3>
                            <p className="text-xs text-slate-400">Raise verified capital.</p>
                        </button>

                        <button
                            onClick={() => handleRegister("investor")}
                            disabled={isLoading !== null}
                            className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all group disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                        >
                            {isLoading === "investor" && (
                                <div className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            )}
                            <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700">Investor</h3>
                            <p className="text-xs text-slate-400">Discover and fund unicorns.</p>
                        </button>

                        <button
                            onClick={() => handleRegister("student")}
                            disabled={isLoading !== null}
                            className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all group disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                        >
                            {isLoading === "student" && (
                                <div className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            )}
                            <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700">Student</h3>
                            <p className="text-xs text-slate-400">Publish your ideas in Incube.</p>
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                        Both options use <span className="text-slate-600 font-medium">Continue with Google</span> to securely create your account.
                    </p>

                    <p className="text-center text-sm text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
