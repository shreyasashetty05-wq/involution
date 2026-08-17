"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Mail, Lock, User, Eye, EyeOff, Check, X, ShieldAlert } from "lucide-react";
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
    const [showPassword, setShowPassword] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const router = useRouter();
    const { isLoading: isGoogleLoading, error: googleError, handleGoogleAuth } = useGoogleAuth(role);

    // Merge Google auth errors into local error state
    const displayError = error || googleError;

    // Password validation logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&._-]/.test(password);

    const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isPasswordValid) {
            setError("Please ensure your password meets all requirements.");
            return;
        }

        setIsEmailLoading(true);
        setError(null);
        setSuccessMsg(null);
        
        document.cookie = `involution_role=${role}; path=/; max-age=3600; Secure; SameSite=Lax`;

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username, role }),
            });

            // Check if the response is actually JSON before parsing
            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response from server:", text);
                setError(`Server returned an invalid response (${res.status}). Check Vercel logs.`);
                setIsEmailLoading(false);
                return;
            }

            if (!res.ok) {
                // Check if it's the generic Zod error
                if (res.status === 400 && data.error === "Invalid request data. Please check your inputs and try again.") {
                     setError("Registration failed. Please check that your email is valid and username only contains allowed characters.");
                } else {
                     setError(data.error || "Sign up failed. Please check your inputs.");
                }
                setIsEmailLoading(false);
                return;
            }

            if (data.requiresVerification) {
                setSuccessMsg("Account created! Please enter the 6-digit verification code sent to your email.");
                setShowOtpInput(true);
                setIsEmailLoading(false);
            } else {
                setSuccessMsg("Account created successfully! Redirecting...");
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }

        } catch (err) {
            console.error("Network or parsing error:", err);
            setError("Network error: Could not connect to the server.");
            setIsEmailLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsOtpLoading(true);
        setError(null);
        setSuccessMsg(null);
        
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token: otp, type: 'signup' }),
            });
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || "Invalid verification code.");
                setIsOtpLoading(false);
                return;
            }
            
            setSuccessMsg("Email verified successfully! Redirecting...");
            
            // Redirect to dashboard based on role
            setTimeout(() => {
                const dashUrl = role === "startup" ? "/startups/dashboard" : 
                                role === "incubation" ? "/incube/dashboard" : 
                                "/investors/dashboard";
                router.push(dashUrl);
            }, 2000);
            
        } catch (err) {
            setError("An unexpected error occurred. Please try again later.");
            setIsOtpLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative bg-[#f8faf9] overflow-hidden">
            {/* Soft bg blobs */}
            <div className="absolute top-0 left-0 size-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 size-[400px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up my-8">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="size-4" /> Back to Home
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 md:p-10 text-center relative overflow-hidden">
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

                    {showOtpInput ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                            <div className="text-center mb-6 mt-4">
                                <ShieldAlert className="size-12 text-emerald-500 mx-auto mb-3" />
                                <h3 className="text-xl font-semibold text-slate-800">Verify your email</h3>
                                <p className="text-sm text-slate-500 mt-2">We sent a 6-digit code to <br/><span className="font-semibold text-slate-700">{email}</span></p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                                <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="••••••"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-4 text-center tracking-[0.5em] font-mono text-2xl rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-700"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isOtpLoading || otp.length !== 6}
                                className="w-full py-3.5 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-emerald-600/20 mt-6"
                            >
                                {isOtpLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Verifying...</span>
                                    </div>
                                ) : "Verify Email"}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => setShowOtpInput(false)}
                                className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Back to sign up
                            </button>
                        </form>
                    ) : (
                        <>
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
                                            type={showPassword ? "text" : "password"} 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a strong password"
                                            required
                                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm text-slate-700"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                    {password.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className={`text-[10px] flex items-center gap-1 ${hasLength ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {hasLength ? <Check className="size-3" /> : <X className="size-3" />} At least 8 characters
                                            </p>
                                            <p className={`text-[10px] flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {hasUpper && hasLower ? <Check className="size-3" /> : <X className="size-3" />} Uppercase and lowercase letters
                                            </p>
                                            <p className={`text-[10px] flex items-center gap-1 ${hasNumber ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {hasNumber ? <Check className="size-3" /> : <X className="size-3" />} At least 1 number
                                            </p>
                                            <p className={`text-[10px] flex items-center gap-1 ${hasSpecial ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {hasSpecial ? <Check className="size-3" /> : <X className="size-3" />} At least 1 special character (@$!%*?&._-)
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isEmailLoading || isGoogleLoading || (password.length > 0 && !isPasswordValid)}
                                    className="w-full py-3.5 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-emerald-600/20 mt-4"
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
