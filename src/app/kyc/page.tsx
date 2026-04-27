"use client";

import { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2, ShieldCheck, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function KYCSubmitPage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [aadhaar, setAadhaar] = useState("");
    const [pan, setPan] = useState("");
    const [fileA, setFileA] = useState<File | null>(null);
    const [fileP, setFileP] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("verifying");
        setErrorMsg("");

        // Strip spaces and dashes so formats like "1234 5678 9012" and "1234-5678-9012" both pass
        const cleanedAadhaar = aadhaar.replace(/[\s\-]/g, '');
        const aadhaarValid = /^\d{12}$/.test(cleanedAadhaar);
        const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim());

        if (!aadhaarValid) {
            setErrorMsg("Aadhaar must be exactly 12 digits (spaces/dashes are OK).");
            setStatus("error");
            return;
        }
        if (!panValid) {
            setErrorMsg("PAN must be in the format: ABCDE1234F (5 letters, 4 digits, 1 letter).");
            setStatus("error");
            return;
        }
        if (!fileA || !fileP) {
            setErrorMsg("Please upload both your Aadhaar card and PAN card documents.");
            setStatus("error");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", "Active User");
            formData.append("type", "Startup Founder");
            formData.append("aadhaar", cleanedAadhaar);
            formData.append("pan", pan.trim().toUpperCase());
            formData.append("aadhaarFile", fileA);
            formData.append("panFile", fileP);

            const res = await fetch("/api/kyc/submit", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Submission failed on server");
            }

            await update({ kycDone: true });
            setStatus("success");

            setTimeout(() => {
                const role = (session?.user as any)?.role;
                router.push(role === 'investor' ? '/investors/dashboard' : '/startups/dashboard');
            }, 2000);

        } catch (error: any) {
            console.error("KYC POST Error:", error);
            setErrorMsg(error.message || "Something went wrong. Please try again.");
            setStatus("error");
        }
    };


    const aadharMasked = aadhaar && aadhaar.length >= 12 ? `XXXX-XXXX-${aadhaar.slice(-4)}` : aadhaar;

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-screen">
            <div className="mb-10 text-center animate-fade-in-up">
                <div className="inline-flex justify-center items-center size-16 rounded-full bg-indigo-50 mb-4">
                    <ShieldCheck className="size-8 text-indigo-600" />
                </div>
                <h1 className="text-4xl font-outfit font-bold text-slate-900 mb-4">Secure Identity Verification</h1>
                <p className="text-slate-500 font-inter max-w-xl mx-auto">
                    To ensure platform safety, please complete your simulated KYC by providing your PAN and Aadhaar details. Your documents are encrypted and securely validated.
                </p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-32 -left-32 size-64 bg-indigo-600/20 rounded-full blur-[100px]" />

                {status === "success" ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                        <div className="size-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="size-10 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 font-outfit mb-3">Verification Successful</h2>
                        <p className="text-slate-500 max-w-md">Your Aadhaar <b>({aadharMasked})</b> and PAN have been verified via our OCR validation simulation. Your profile is now marked as secure.</p>
                        <p className="mt-4 text-indigo-600 font-medium flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Redirecting to your dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">

                            {/* Aadhaar Section */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-600 font-inter">Aadhaar Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        value={aadhaar}
                                        onChange={(e) => setAadhaar(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50 group cursor-pointer relative overflow-hidden">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFileA(e.target.files?.[0] || null)} required />
                                    <Upload className="mx-auto size-8 text-slate-500 group-hover:text-indigo-600 mb-2 transition-colors" />
                                    <p className="text-sm text-slate-600 font-medium">Upload Aadhaar Card</p>
                                    <p className="text-xs text-slate-500 mt-1">{fileA ? fileA.name : "PNG, JPG, PDF up to 5MB"}</p>
                                </div>
                            </div>

                            {/* PAN Section */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-600 font-inter">PAN Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ABCDE1234F"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all uppercase"
                                        value={pan}
                                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>

                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors bg-slate-50 group cursor-pointer relative overflow-hidden">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFileP(e.target.files?.[0] || null)} required />
                                    <FileText className="mx-auto size-8 text-slate-500 group-hover:text-pink-400 mb-2 transition-colors" />
                                    <p className="text-sm text-slate-600 font-medium">Upload PAN Card</p>
                                    <p className="text-xs text-slate-500 mt-1">{fileP ? fileP.name : "PNG, JPG, PDF up to 5MB"}</p>
                                </div>
                            </div>

                        </div>

                        {status === "error" && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                                <AlertCircle className="size-5 shrink-0" />
                                <p className="text-sm">{errorMsg || "Validation failed. Please check your details and uploaded files."}</p>
                            </div>
                        )}


                        <div className="pt-4 border-t border-slate-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={status === "verifying"}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-slate-900 font-semibold rounded-full hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === "verifying" ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        Simulating OCR Validation...
                                    </>
                                ) : (
                                    "Submit Documents"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
