"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Mail, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/**
 * Renders the login page with role selection, email/password sign-in, and Google sign-in.
 */
export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [role, setRole] = useState("investor");
    
    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        document.cookie = `involution_role=${role}; path=/; max-age=3600`;
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`
            }
        });
        if (authError) {
            console.error("Login Error:", authError);
            setError("Google login failed. Please try again.");
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmailLoading(true);
        setError(null);
        
        document.cookie = `involution_role=${role}; path=/; max-age=3600`;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed. Please check your credentials.");
                setIsEmailLoading(false);
                return;
            }

            // Redirect based on role
            if (role === "investor") {
                router.push("/investors/dashboard");
            } else if (role === "startup") {
                router.push("/startups/dashboard");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again later.");
            setIsEmailLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#f8faf9] overflow-hidden">
            {/* Soft bg blobs */}
            <div className="absolute top-0 right-0 size-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-[400px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up my-8">
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
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 mx-auto w-fit">
                        <button
                            type="button"
                            onClick={() => setRole("investor")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === "investor" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Investor
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("startup")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === "startup" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Founder
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("student")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === "student" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Student
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-left animate-fade-in-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <button type="button" className="text-xs text-emerald-600 hover:underline">Forgot password?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm text-slate-700"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isEmailLoading || isLoading}
                            className="w-full py-3.5 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-emerald-600/20"
                        >
                            {isEmailLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </div>
                            ) : "Sign In"}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-6">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-xs text-slate-400 font-medium">or continue with</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading || isEmailLoading}
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
