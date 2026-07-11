"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { RoleToggle } from "@/components/RoleToggle";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useGoogleAuth } from "@/frontend/hooks/useGoogleAuth";

/**
 * Renders the registration page where users choose a role and sign up via email or Google.
 */
export default function RegisterPage() {
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [role, setRole] = useState("investor");
    
    // Form states
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const router = useRouter();
    const { isLoading: isGoogleLoading, error: googleError, handleGoogleAuth } = useGoogleAuth(role);

    // Merge Google auth errors into local error state
    const displayError = error || googleError;

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmailLoading(true);
        setError(null);
        setSuccessMsg(null);
        
        document.cookie = `involution_role=${role}; path=/; max-age=3600`;

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Sign up failed. Please check your inputs.");
                setIsEmailLoading(false);
                return;
            }

            setSuccessMsg("Account created successfully! Redirecting...");
            
            // Redirect to login after a short delay
            setTimeout(() => {
                router.push("/login");
            }, 1500);

        } catch (err) {
            setError("An unexpected error occurred. Please try again later.");
            setIsEmailLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#f8faf9] overflow-hidden">
            {/* Soft bg blobs */}
            <div className="absolute top-0 left-0 size-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 size-[400px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up my-8">
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
                    <p className="text-slate-500 text-sm mb-6 px-4">
                        Create your account to connect. KYC verification will follow after sign-up.
                    </p>

                    {/* Role toggle */}
                    <RoleToggle role={role} setRole={setRole} />

                    {displayError && (
                        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-left animate-fade-in-up">
                            {displayError}
                        </div>
                    )}
                    
                    {successMsg && (
                        <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm text-left animate-fade-in-up">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleEmailRegister} className="space-y-4 text-left">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm text-slate-700"
                                />
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">Alphanumeric, underscores, hyphens only.</p>
                        </div>

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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm text-slate-700"
                                />
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.</p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isEmailLoading || isGoogleLoading}
                            className="w-full py-3.5 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-emerald-600/20"
                        >
                            {isEmailLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creating account...</span>
                                </div>
                            ) : "Create Account"}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-6">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-xs text-slate-400 font-medium">or continue with</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <GoogleAuthButton
                        onClick={handleGoogleAuth}
                        disabled={isGoogleLoading || isEmailLoading}
                        isLoading={isGoogleLoading}
                    />

                    <p className="mt-8 text-xs text-slate-400">
                        By signing up, you agree to our <Link href="/rules" className="text-emerald-600 hover:underline font-medium">Rules &amp; Liability Policy</Link>.
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
