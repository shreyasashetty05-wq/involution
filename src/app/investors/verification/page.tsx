"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Link as LinkIcon, FileText, CheckCircle, Shield, UploadCloud, AlertCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function InvestorVerificationForm() {
    const router = useRouter();
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [fetchedKycName, setFetchedKycName] = useState<string | null>(null);
    const [adminRemarks, setAdminRemarks] = useState("");

    const [formData, setFormData] = useState({
        photo_url: "",
        full_name: "",
        phone_number: "",
        country: "",
        city: "",
        occupation: "",
        linkedin_profile: "",
        investor_type: "",
        years_of_experience: "",
        startups_invested_in: 0,
        portfolio_website: "",
        investment_thesis: "",
        investment_budget: "",
        source_of_funds: "",
        company_name: "",
        designation: "",
        official_website: "",
        business_email: "",
        x_twitter: "",
        personal_website: "",
        supporting_documents: [] as { title: string, url: string }[],
        payment_method: "Bank Account",
        upi_id: "",
        account_holder_name: "",
        bank_name: "",
        account_number: "",
        ifsc_code: "",
    });

    const [docs, setDocs] = useState({
        angel_network: "",
        sebi_reg: "",
        company_reg: "",
        portfolio_fund: "",
        other_docs: ""
    });

    const [declaration, setDeclaration] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setCurrentUser(user);
            setEmail(user.email || "");

            const res = await fetch("/api/investors/verification");
            const data = await res.json();

            if (data.profile) {
                if (data.profile.status === "Pending Verification") {
                    router.push("/investors/verification/pending");
                    return;
                }
                if (data.profile.status === "Verified") {
                    router.push("/investors/dashboard");
                    return;
                }
                
                if (data.profile.status === "Rejected" || data.profile.status === "Request More Information") {
                    setAdminRemarks(data.profile.admin_remarks || "");
                }

                if (data.kycName) {
                    setFetchedKycName(data.kycName);
                }

                setFormData({
                    ...data.profile,
                    full_name: (data.kycName ? data.kycName : (user?.user_metadata?.kycStatus === 'Approved' ? (user.user_metadata.kyc_name || user.user_metadata.full_name) : data.profile.full_name)) || ""
                });

                // Map docs back
                const fetchedDocs = data.profile.supporting_documents || [];
                const newDocs = { angel_network: "", sebi_reg: "", company_reg: "", portfolio_fund: "", other_docs: "" };
                fetchedDocs.forEach((d: any) => {
                    if (d.title === "Angel Network Membership Certificate") newDocs.angel_network = d.url;
                    else if (d.title === "SEBI Registration Certificate (if applicable)") newDocs.sebi_reg = d.url;
                    else if (d.title === "Company Registration Certificate") newDocs.company_reg = d.url;
                    else if (d.title === "Portfolio / Fund Details") newDocs.portfolio_fund = d.url;
                    else if (d.title === "Other Supporting Documents") newDocs.other_docs = d.url;
                });
                setDocs(newDocs);
            } else {
                if (data.kycName) {
                    setFetchedKycName(data.kycName);
                }
                if (data.kycName || user?.user_metadata?.kycStatus === 'Approved') {
                    setFormData(prev => ({
                        ...prev,
                        full_name: data.kycName || (user.user_metadata.kyc_name || user.user_metadata.full_name) || ""
                    }));
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [router, supabase]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // basic validation
        if (!file.type.startsWith("image/")) {
            setError("Please upload a valid image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB.");
            return;
        }

        setUploadingPhoto(true);
        setError("");

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `investor-photos/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('investors')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('investors')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo_url: publicUrl }));
        } catch (err: any) {
            setError(err.message || "Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDocs(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!declaration) {
            setError("You must certify that all information is true and accurate.");
            return;
        }

        setSubmitting(true);

        // Compile documents
        const compiledDocs = [];
        if (docs.angel_network) compiledDocs.push({ title: "Angel Network Membership Certificate", url: docs.angel_network });
        if (docs.sebi_reg) compiledDocs.push({ title: "SEBI Registration Certificate (if applicable)", url: docs.sebi_reg });
        if (docs.company_reg) compiledDocs.push({ title: "Company Registration Certificate", url: docs.company_reg });
        if (docs.portfolio_fund) compiledDocs.push({ title: "Portfolio / Fund Details", url: docs.portfolio_fund });
        if (docs.other_docs) compiledDocs.push({ title: "Other Supporting Documents", url: docs.other_docs });

        const payload = { ...formData, supporting_documents: compiledDocs };

        try {
            const res = await fetch("/api/investors/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                router.push("/investors/verification/pending");
            } else {
                setError(data.error || "Failed to submit verification.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Investor Verification Form</h1>
                        <p className="text-slate-500 mt-2">Complete your investor profile to gain access to verified startup opportunities. All submitted information will be reviewed by the admin before your profile becomes fully verified.</p>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                        <Shield className="size-8" />
                    </div>
                </div>

                {adminRemarks && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="size-5 text-red-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Action Required: Your application was reviewed</h3>
                            <p className="text-red-700 text-sm mt-1">{adminRemarks}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Personal Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><User className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">1. Personal Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:row-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Investor Photo URL *</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 flex flex-col items-center justify-center bg-slate-50 text-slate-500 overflow-hidden relative group">
                                    {formData.photo_url ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={formData.photo_url} alt="Profile" className="object-cover w-full h-full" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-medium text-sm">Change Photo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {uploadingPhoto ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="size-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                    <span className="text-sm font-medium">Uploading...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <UploadCloud className="size-8 mb-2 text-indigo-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-medium">Click to Upload Photo</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handlePhotoUpload} 
                                        disabled={uploadingPhoto}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                                        title="Upload Investor Photo"
                                    />
                                </div>
                                {formData.photo_url && (
                                    <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircle className="size-3" /> Photo uploaded successfully
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} placeholder="Enter your full name" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed" disabled={!!(fetchedKycName || currentUser?.user_metadata?.kycStatus === 'Approved' || formData.full_name === currentUser?.user_metadata?.kyc_name)} title={(fetchedKycName || currentUser?.user_metadata?.kycStatus === 'Approved' || formData.full_name === currentUser?.user_metadata?.kyc_name) ? "Your verified Legal Name cannot be changed" : ""} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email (Read Only)</label>
                                <input type="email" readOnly value={email} className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 text-slate-500 cursor-not-allowed outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange} placeholder="Enter phone number" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Country *</label>
                                <input type="text" name="country" required value={formData.country} onChange={handleChange} placeholder="Select country" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                                <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="Enter your city" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Occupation *</label>
                                <input type="text" name="occupation" required value={formData.occupation} onChange={handleChange} placeholder="Enter your occupation" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Investor Profile */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><User className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">2. Investor Profile</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Investor Type *</label>
                                <select name="investor_type" required value={formData.investor_type} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white">
                                    <option value="">Select investor type</option>
                                    <option value="Angel Investor">Angel Investor</option>
                                    <option value="Venture Capital">Venture Capital</option>
                                    <option value="Family Office">Family Office</option>
                                    <option value="Corporate Investor">Corporate Investor</option>
                                    <option value="Syndicate">Syndicate</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Years of Investment Experience *</label>
                                <select name="years_of_experience" required value={formData.years_of_experience} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white">
                                    <option value="">Select experience</option>
                                    <option value="0-2 Years">0-2 Years</option>
                                    <option value="3-5 Years">3-5 Years</option>
                                    <option value="5-10 Years">5-10 Years</option>
                                    <option value="10+ Years">10+ Years</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Startups Invested In *</label>
                                <input type="number" name="startups_invested_in" required min="0" value={formData.startups_invested_in} onChange={handleChange} placeholder="Enter number" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            
                            <div className="md:col-span-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Portfolio Website (Optional)</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-3.5 size-4 text-slate-400" />
                                    <input type="url" name="portfolio_website" value={formData.portfolio_website} onChange={handleChange} placeholder="https://yourportfolio.com" className="w-full border border-slate-200 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Investment Thesis *</label>
                                <textarea name="investment_thesis" required value={formData.investment_thesis} onChange={handleChange} placeholder="Describe the type of startups you prefer to invest in, your philosophy..." className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 3. Investment Capacity */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><CheckCircle className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">3. Investment Capacity Verification</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Annual Investment Budget *</label>
                                <select name="investment_budget" required value={formData.investment_budget} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white">
                                    <option value="">Select budget range</option>
                                    <option value="Under ₹50 Lakhs">Under ₹50 Lakhs</option>
                                    <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                                    <option value="₹1 - 5 Crore">₹1 - 5 Crore</option>
                                    <option value="₹5 Crore+">₹5 Crore+</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Source of Investment Funds *</label>
                                <select name="source_of_funds" required value={formData.source_of_funds} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white">
                                    <option value="">Select source of funds</option>
                                    <option value="Personal Funds">Personal Funds</option>
                                    <option value="Corporate Treasury">Corporate Treasury</option>
                                    <option value="LP Commitments">LP Commitments</option>
                                    <option value="Family Wealth">Family Wealth</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 4. Professional Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Briefcase className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">4. Professional Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Company / Organization *</label>
                                <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} placeholder="Enter company name" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Designation *</label>
                                <input type="text" name="designation" required value={formData.designation} onChange={handleChange} placeholder="Enter your designation" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Official Website (Optional)</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-3.5 size-4 text-slate-400" />
                                    <input type="url" name="official_website" value={formData.official_website} onChange={handleChange} placeholder="https://company.com" className="w-full border border-slate-200 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Business Email (Optional)</label>
                                <input type="email" name="business_email" value={formData.business_email} onChange={handleChange} placeholder="work@company.com" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* 5. Social Links */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><LinkIcon className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">5. Social & Professional Links</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile (Optional)</label>
                                <input type="url" name="linkedin_profile" value={formData.linkedin_profile} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">X (Twitter) (Optional)</label>
                                <input type="url" name="x_twitter" value={formData.x_twitter} onChange={handleChange} placeholder="https://x.com/..." className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Personal Website (Optional)</label>
                                <input type="url" name="personal_website" value={formData.personal_website} onChange={handleChange} placeholder="https://yourwebsite.com" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* 6. Documents */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">6. Supporting Documents (Optional)</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-6">Provide document links from Google Drive or uploaded files.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: "Angel Network Membership Certificate", name: "angel_network", val: docs.angel_network },
                                    { label: "SEBI Registration Certificate (if applicable)", name: "sebi_reg", val: docs.sebi_reg },
                                    { label: "Company Registration Certificate", name: "company_reg", val: docs.company_reg },
                                    { label: "Portfolio / Fund Details", name: "portfolio_fund", val: docs.portfolio_fund },
                                    { label: "Other Supporting Documents", name: "other_docs", val: docs.other_docs },
                                ].map((doc, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <label className="text-sm font-semibold text-slate-700 mb-2">{doc.label}</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3.5 size-4 text-slate-400" />
                                            <input type="url" name={doc.name} value={doc.val} onChange={handleDocChange} placeholder="Paste Google Drive link" className="w-full border border-slate-200 rounded-lg p-3 pl-10 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50" />
                                            <div className="absolute right-3 top-3.5 text-slate-400">
                                                <LinkIcon className="size-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 7. Payment Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Shield className="size-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">7. Payment Details</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-6">These payment details will be used during the Smart Agreement process. Please provide accurate information.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Payment Method *</label>
                                    <select name="payment_method" required value={formData.payment_method} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white">
                                        <option value="Bank Account">Bank Account</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                            </div>
                            {formData.payment_method === "UPI" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">UPI ID *</label>
                                        <input type="text" name="upi_id" required value={formData.upi_id || ""} onChange={handleChange} placeholder="e.g. abc@okaxis" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Account Holder Name *</label>
                                        <input type="text" name="account_holder_name" required value={formData.account_holder_name || ""} onChange={handleChange} placeholder="e.g. John Doe" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Bank Name *</label>
                                        <input type="text" name="bank_name" required value={formData.bank_name || ""} onChange={handleChange} placeholder="e.g. HDFC Bank" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Account Number *</label>
                                        <input type="text" name="account_number" required value={formData.account_number || ""} onChange={handleChange} placeholder="e.g. 50100123456789" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">IFSC Code *</label>
                                        <input type="text" name="ifsc_code" required value={formData.ifsc_code || ""} onChange={handleChange} placeholder="e.g. HDFC0001234" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 8. Final Declaration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
                        <input 
                            type="checkbox" 
                            id="declaration" 
                            checked={declaration} 
                            onChange={(e) => setDeclaration(e.target.checked)}
                            className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
                        />
                        <label htmlFor="declaration" className="text-sm text-slate-700 leading-relaxed">
                            I certify that all the information provided is true and accurate. I understand that submitting false or misleading information may result in the suspension or permanent removal of my investor account.
                        </label>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                        <button type="button" onClick={() => router.push("/login")} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button disabled={submitting} type="submit" className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                            {submitting ? "Submitting..." : (
                                <>
                                    <Shield className="size-5" />
                                    Submit Investor Profile for Verification
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
