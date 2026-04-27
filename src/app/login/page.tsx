"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";

/**
 * Renders the login page with role selection and Google sign-in for investors or startup founders.
 * @example
 * LoginPage()
 * React component element for the login page
 * @returns {JSX.Element} The login page UI.
 */
export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState("investor");

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        document.cookie = `involution_role=${role}; path=/; max-age=3600`;
        const dashboardRoute = role === "investor" ? "/investors/dashboard" : "/startups/dashboard";
        await signIn("google", { callbackUrl: dashboardRoute });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#f8faf9] overflow-hidden">
            {/* Soft bg blobs */}
            <div className="absolute top-0 right-0 size-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-[400px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="size-4" /> Back to Home
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-10 text-center relative overflow-hidden">
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>

                    <div className="size-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="size-8 text-emerald-600" />
                    </div>

                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500 text-sm mb-6 px-4">
                        Securely authenticate to access the InVolution Deal Room and personalized matches.
                    </p>

                    {/* Role toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-8 mx-auto w-fit">
                        <button
                            onClick={() => setRole("investor")}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${role === "investor" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Investor
                        </button>
                        <button
                            onClick={() => setRole("startup")}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${role === "startup" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Startup Founder
                        </button>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg className="size-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-3 my-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs text-slate-400 font-medium">or</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <button disabled className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-medium text-sm cursor-not-allowed opacity-60">
                            <Mail className="size-5" /> Continue with Email
                        </button>
                    </div>

                    <p className="mt-8 text-xs text-slate-400">
                        By signing in, you agree to our <Link href="/rules" className="text-emerald-600 hover:underline font-medium">Rules & Liability Policy</Link>.
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                        New here? <Link href="/register" className="text-emerald-600 hover:underline font-medium">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
