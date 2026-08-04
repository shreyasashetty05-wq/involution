"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles, Users, TrendingUp, Rocket, GraduationCap } from "lucide-react";
import { RoleToggle } from "@/components/RoleToggle";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useGoogleAuth } from "@/frontend/hooks/useGoogleAuth";
import { motion, AnimatePresence } from "framer-motion";

const roleContent = {
    investor: {
        icon: TrendingUp,
        title: "Investor Portal",
        subtitle: "Sign in to discover verified startups, evaluate AI-powered insights, manage your investments, and connect with promising founders.",
        color: "emerald"
    },
    startup: {
        icon: Rocket,
        title: "Founder Space",
        subtitle: "Connect with investors and accelerate your startup's growth journey.",
        color: "emerald"
    },
    incubation: {
        icon: GraduationCap,
        title: "Student Hub",
        subtitle: "Learn, innovate, and join a verified community of builders.",
        color: "emerald"
    }
};

function LoginContent() {
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [role, setRole] = useState<"investor" | "startup" | "incubation">("investor");
    const [showPassword, setShowPassword] = useState(false);
    
    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading: isGoogleLoading, error: googleError, handleGoogleAuth } = useGoogleAuth(role);

    useEffect(() => {
        const urlError = searchParams.get("error");
        const urlMessage = searchParams.get("message");
        if (urlError) setError(urlError);
        if (urlMessage) setInfoMessage(urlMessage);
    }, [searchParams]);

    const displayError = error || googleError;

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmailLoading(true);
        setError(null);
        setInfoMessage(null);
        
        document.cookie = `involution_role=${role}; path=/; max-age=3600; Secure; SameSite=Lax`;

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

            const userRole = (data.user?.user_metadata?.role || role).toLowerCase();
            const dashUrl = userRole === "startup" ? "/startups/dashboard" : 
                            userRole === "incubation" ? "/incube/dashboard" : 
                            userRole === "mentor" ? "/mentors/dashboard" : 
                            userRole === "admin" ? "/admin/kyc" :
                            "/investors/dashboard";
            router.push(dashUrl);
        } catch (err) {
            setError("An unexpected error occurred. Please try again later.");
            setIsEmailLoading(false);
        }
    };

    const currentContent = roleContent[role];
    const RoleIcon = currentContent.icon;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#f8faf9] overflow-hidden selection:bg-emerald-200">
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
                
                {/* Floating Particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ 
                            y: [0, Math.random() * -100 - 50], 
                            x: [0, Math.random() * 40 - 20],
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{ 
                            duration: Math.random() * 5 + 5, 
                            repeat: Infinity, 
                            delay: Math.random() * 5,
                            ease: "easeInOut"
                        }}
                        className="absolute size-2 bg-emerald-300 rounded-full blur-[1px]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            <div className="w-full max-w-md relative z-10 flex flex-col items-center">
                <div className="w-full mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-medium group">
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Back to Home
                    </Link>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // smooth ease out
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05),0_0_0_1px_rgba(255,255,255,0.5)_inset,0_0_0_1px_rgba(0,0,0,0.02)] border border-slate-100/50 p-8 md:p-10 w-full text-center relative"
                >
                    {/* Top gradient accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

                    {/* Animated Shield */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                        transition={{ 
                            opacity: { duration: 0.5 },
                            scale: { duration: 0.5, ease: "easeOut" },
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="size-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative"
                    >
                        <ShieldCheck className="size-8 text-emerald-600 drop-shadow-sm" />
                        <motion.div 
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-md -z-10"
                        />
                    </motion.div>

                    {/* Role Content Transitions */}
                    <div className="h-[90px] mb-6 flex flex-col justify-end">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2 tracking-tight">
                                    {currentContent.title}
                                </h1>
                                <p className="text-slate-500 text-sm px-4 leading-relaxed">
                                    {currentContent.subtitle}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <RoleToggle role={role} setRole={setRole as any} />

                    {infoMessage && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm text-left">
                            {infoMessage}
                        </motion.div>
                    )}

                    {displayError && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-left">
                            {displayError}
                        </motion.div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                        <div className="group/input">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within/input:text-emerald-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400 transition-colors group-focus-within/input:text-emerald-600" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="peer w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all outline-none text-sm text-slate-800 shadow-sm placeholder:text-slate-400 placeholder:transition-transform focus:placeholder:translate-x-1"
                                />
                            </div>
                        </div>

                        <div className="group/input">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-semibold text-slate-700 transition-colors group-focus-within/input:text-emerald-700">Password</label>
                                <button type="button" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Forgot password?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400 transition-colors group-focus-within/input:text-emerald-600" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="peer w-full pl-11 pr-11 py-3.5 bg-white rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all outline-none text-sm text-slate-800 shadow-sm placeholder:text-slate-400 placeholder:transition-transform focus:placeholder:translate-x-1"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{ rotate: showPassword ? 180 : 0, scale: showPassword ? 1.1 : 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </motion.div>
                                </button>
                            </div>
                        </div>

                        <motion.button 
                            type="submit" 
                            disabled={isEmailLoading || isGoogleLoading}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative w-full py-3.5 px-6 mt-2 overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-[0_8px_16px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_24px_rgba(16,185,129,0.3)] hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                                {isEmailLoading ? (
                                    <>
                                        <div className="size-4 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </form>

                    <div className="flex items-center gap-4 my-7 opacity-80">
                        <div className="h-px bg-gradient-to-r from-transparent to-slate-200 flex-1"></div>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">or continue with</span>
                        <div className="h-px bg-gradient-to-l from-transparent to-slate-200 flex-1"></div>
                    </div>

                    <GoogleAuthButton
                        onClick={handleGoogleAuth}
                        disabled={isGoogleLoading || isEmailLoading}
                        isLoading={isGoogleLoading}
                    />

                    <p className="mt-8 text-xs text-slate-500">
                        By signing in, you agree to our <Link href="/rules" className="text-emerald-600 hover:text-emerald-700 transition-colors font-semibold">Rules &amp; Liability Policy</Link>.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        New here? <Link href="/register" className="text-emerald-600 hover:text-emerald-700 transition-colors font-semibold">Create an account</Link>
                    </p>
                </motion.div>

                {/* Bottom Feature Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="w-full mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {[
                        { 
                            icon: Shield, 
                            title: "Secure & Trusted", 
                            subtitle: "End-to-end encryption",
                            bgClass: "bg-emerald-50",
                            borderClass: "border-emerald-100/50",
                            textClass: "text-emerald-600"
                        },
                        { 
                            icon: Sparkles, 
                            title: "AI-Powered", 
                            subtitle: "Smart matching",
                            bgClass: "bg-amber-50",
                            borderClass: "border-amber-100/50",
                            textClass: "text-amber-600"
                        },
                        { 
                            icon: Users, 
                            title: "Verified Community", 
                            subtitle: "Trusted founders",
                            bgClass: "bg-blue-50",
                            borderClass: "border-blue-100/50",
                            textClass: "text-blue-600"
                        }
                    ].map((feature, i) => (
                        <motion.div 
                            key={i}
                            whileHover={{ y: -3, scale: 1.02 }}
                            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/50 shadow-sm transition-all hover:bg-white/70 hover:shadow-md"
                        >
                            <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(0,0,0,0.05)] ${feature.bgClass} ${feature.borderClass} ${feature.textClass}`}>
                                <feature.icon className="size-5" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xs font-bold text-slate-800">{feature.title}</h3>
                                <p className="text-[10px] text-slate-500 font-medium">{feature.subtitle}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

/**
 * Renders the login page wrapped in a Suspense boundary to support search parameters.
 */
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8faf9]">
                <div className="size-8 border-[3px] border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
