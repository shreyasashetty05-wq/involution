"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2, ShieldCheck, FileText, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatBytes } from "@/utils/formatBytes";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function KYCSubmitPage() {
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const [aadhaar, setAadhaar] = useState("");
    const [pan, setPan] = useState("");
    const [fileA, setFileA] = useState<File | null>(null);
    const [fileP, setFileP] = useState<File | null>(null);
    const [previewA, setPreviewA] = useState<string | null>(null);
    const [previewP, setPreviewP] = useState<string | null>(null);
    
    // Status states
    const [status, setStatus] = useState<"idle" | "uploading" | "submitting" | "success" | "error">("idle");
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);
    const [errorMsg, setErrorMsg] = useState("");
    const [fileErrorA, setFileErrorA] = useState("");
    const [fileErrorP, setFileErrorP] = useState("");
    
    // Drag states
    const [dragA, setDragA] = useState(false);
    const [dragP, setDragP] = useState(false);

    useEffect(() => {
        const fetchUserAndKyc = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            
            if (user?.email) {
                const { data: existingKyc } = await supabase
                    .from("kyc_documents")
                    .select("aadhaar, pan, status")
                    .eq("email", user.email)
                    .maybeSingle();
                    
                if (existingKyc && (existingKyc.status === 'Rejected' || existingKyc.status === 'Pending')) {
                    setAadhaar(formatAadhaar(existingKyc.aadhaar));
                    setPan(existingKyc.pan);
                }
            }
        };
        fetchUserAndKyc();
    }, [supabase]);

    const formatAadhaar = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 12);
        const match = cleaned.match(/.{1,4}/g);
        return match ? match.join(' ') : cleaned;
    };

    const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAadhaar(formatAadhaar(e.target.value));
    };

    const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
    };

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Only JPG, JPEG, PNG or WEBP images are allowed (Maximum 5 MB).";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "Only JPG, JPEG, PNG or WEBP images are allowed (Maximum 5 MB).";
        }
        return null;
    };

    const handleFileSelect = (file: File, type: 'A' | 'P') => {
        const error = validateFile(file);
        if (type === 'A') {
            if (error) { setFileErrorA(error); setFileA(null); setPreviewA(null); }
            else { setFileErrorA(""); setFileA(file); setPreviewA(URL.createObjectURL(file)); }
        } else {
            if (error) { setFileErrorP(error); setFileP(null); setPreviewP(null); }
            else { setFileErrorP(""); setFileP(file); setPreviewP(URL.createObjectURL(file)); }
        }
    };

    const handleDrop = (e: React.DragEvent, type: 'A' | 'P') => {
        e.preventDefault();
        if (type === 'A') setDragA(false); else setDragP(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0], type);
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const cleanedAadhaar = aadhaar.replace(/\s/g, '');
        if (!/^\d{12}$/.test(cleanedAadhaar)) {
            setErrorMsg("Aadhaar must be exactly 12 digits.");
            return;
        }
        
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            setErrorMsg("PAN must be in the format: ABCDE1234F.");
            return;
        }

        if (!fileA || !fileP) {
            setErrorMsg("Please upload both your Aadhaar card and PAN card images.");
            return;
        }

        try {
            setStatus("uploading");
            const formData = new FormData();
            formData.append("name", user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Active User");
            formData.append("type", user?.user_metadata?.role === "investor" ? "Investor" : "Startup Founder");
            formData.append("aadhaar", cleanedAadhaar);
            formData.append("pan", pan);
            formData.append("aadhaarFile", fileA);
            formData.append("panFile", fileP);

            setTimeout(() => {
                if (statusRef.current !== 'error') setStatus("submitting");
            }, 1000);

            const res = await fetch("/api/kyc/submit", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Submission failed on server");
            }

            await supabase.auth.refreshSession();
            setStatus("success");

            setTimeout(() => {
                router.push('/kyc/pending');
            }, 1500);

        } catch (error: any) {
            console.error("KYC POST Error:", error);
            setErrorMsg(error.message || "Something went wrong. Please try again.");
            setStatus("error");
        }
    };

    const FileUploadCard = ({ type, file, preview, error, drag, setDrag }: any) => (
        <div 
            className={`border-2 rounded-2xl p-6 text-center transition-all relative overflow-hidden group 
                ${error ? 'border-red-300 bg-red-50' : drag ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50'}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => handleDrop(e, type)}
        >
            {preview ? (
                <div className="flex items-center gap-4 text-left relative z-10">
                    <div className="relative size-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                        <Image src={preview} alt="Preview" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{file?.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file?.size || 0)}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <label className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                            Replace <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], type)} />
                        </label>
                        <button type="button" onClick={() => type === 'A' ? (setFileA(null), setPreviewA(null)) : (setFileP(null), setPreviewP(null))} className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md transition-colors">
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], type)} />
                    <Upload className={`mx-auto size-10 mb-3 transition-colors ${drag ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                    <p className="text-sm text-slate-700 font-medium mb-1">Drag & Drop or <span className="text-indigo-600">Click to Browse</span></p>
                    <div className="flex justify-center gap-3 text-xs text-slate-500 font-medium">
                        <span>JPG • PNG • WEBP</span>
                        <span>Maximum 5 MB</span>
                    </div>
                </>
            )}
            
            {error && (
                <div className="mt-4 p-2.5 bg-red-100 rounded-lg text-xs text-red-700 font-medium flex items-center justify-center gap-1.5 relative z-10">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-screen">
            <div className="mb-10 text-center animate-fade-in-up">
                <div className="inline-flex justify-center items-center size-16 rounded-full bg-indigo-50 mb-4">
                    <ShieldCheck className="size-8 text-indigo-600" />
                </div>
                <h1 className="text-4xl font-outfit font-bold text-slate-900 mb-4">Secure Identity Verification</h1>
                <p className="text-slate-500 font-inter max-w-xl mx-auto">
                    To ensure platform safety, please complete your KYC by providing your PAN and Aadhaar details. Your documents are encrypted and securely validated.
                </p>
                {user?.user_metadata?.kycStatus === 'Rejected' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium max-w-lg mx-auto flex items-start gap-3 text-left shadow-sm">
                        <AlertCircle className="size-5 shrink-0 mt-0.5" />
                        <p>Your previous KYC application was rejected or requires more information. Please review and submit clear, accurate documents.</p>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute -top-32 -left-32 size-64 bg-indigo-600/10 rounded-full blur-[100px]" />

                {status === "success" ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                        <div className="size-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="size-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 font-outfit mb-3">Documents Submitted</h2>
                        <p className="text-slate-500 max-w-md">Your KYC documents have been successfully submitted for review.</p>
                        <p className="mt-6 text-indigo-600 font-medium flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full"><Loader2 className="size-4 animate-spin" /> Redirecting to status page...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 font-inter">Aadhaar Number</label>
                                <input
                                    type="text"
                                    placeholder="1234 5678 9012"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    value={aadhaar}
                                    onChange={handleAadhaarChange}
                                    required
                                />
                                <FileUploadCard type="A" file={fileA} preview={previewA} error={fileErrorA} drag={dragA} setDrag={setDragA} />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 font-inter">PAN Number</label>
                                <input
                                    type="text"
                                    placeholder="ABCDE1234F"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase"
                                    value={pan}
                                    onChange={handlePanChange}
                                    required
                                    maxLength={10}
                                />
                                <FileUploadCard type="P" file={fileP} preview={previewP} error={fileErrorP} drag={dragP} setDrag={setDragP} />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-medium animate-in fade-in">
                                <AlertCircle className="size-5 shrink-0" />
                                <p className="text-sm">{errorMsg}</p>
                            </div>
                        )}

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={status === "uploading" || status === "submitting"}
                                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center min-w-[200px] gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
                            >
                                {status === "uploading" ? (
                                    <><Loader2 className="size-5 animate-spin" /> Uploading...</>
                                ) : status === "submitting" ? (
                                    <><Loader2 className="size-5 animate-spin" /> Submitting...</>
                                ) : (
                                    "Submit Documents"
                                )}
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-center gap-8 pt-4 pb-2 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><Lock className="size-4" /> End-to-End Encrypted</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" /> Admin Only Access</span>
                            <span className="flex items-center gap-1.5"><FileText className="size-4" /> Secure Document Storage</span>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
