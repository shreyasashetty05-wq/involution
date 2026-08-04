"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff, Check, X, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const router = useRouter();

    // Password validation logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&._-]/.test(password);
    const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isPasswordValid) {
            setError("Please ensure your password meets all requirements.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch("/api/auth/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to update password.");
                setIsLoading(false);
                return;
            }

            setSuccessMsg("Password updated successfully! Redirecting...");
            
            setTimeout(() => {
                router.push("/login?message=Password updated successfully. You can now log in.");
            }, 2000);

        } catch (err) {
            setError("An unexpected error occurred. Please try again later.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#f8faf9] overflow-hidden selection:bg-emerald-200">
            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] size-[600px] bg-emerald-100/50 rounded-full blur-[140px] opacity-70" 
                />
                <motion.div 
                    animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] left-[-5%] size-[500px] bg-emerald-200/30 rounded-full blur-[120px]" 
                />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="size-4" /> Back to Login
                </Link>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 p-8 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

                    <div className="size-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative">
                        <KeyRound className="size-8 text-emerald-600 drop-shadow-sm" />
                    </div>

                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Update Password</h1>
                    <p className="text-slate-500 text-sm mb-6 px-4">
                        Please enter a strong new password for your account.
                    </p>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-left">
                            {error}
                        </motion.div>
                    )}
                    
                    {successMsg && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm text-left">
                            {successMsg}
                        </motion.div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-4 text-left">
                        <div className="group/input">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    className="peer w-full pl-11 pr-11 py-3.5 bg-white rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all outline-none text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            
                            {password.length > 0 && (
                                <div className="mt-3 space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <p className={`text-[10px] flex items-center gap-1.5 ${hasLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                                        {hasLength ? <Check className="size-3" /> : <X className="size-3 opacity-50" />} At least 8 characters
                                    </p>
                                    <p className={`text-[10px] flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                                        {hasUpper && hasLower ? <Check className="size-3" /> : <X className="size-3 opacity-50" />} Uppercase & lowercase
                                    </p>
                                    <p className={`text-[10px] flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                                        {hasNumber ? <Check className="size-3" /> : <X className="size-3 opacity-50" />} At least 1 number
                                    </p>
                                    <p className={`text-[10px] flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                                        {hasSpecial ? <Check className="size-3" /> : <X className="size-3 opacity-50" />} Special character (@$!%*?&._-)
                                    </p>
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || (password.length > 0 && !isPasswordValid)}
                            className="w-full py-3.5 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-emerald-600/20 mt-6 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="size-4 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Updating...</span>
                                </div>
                            ) : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
