"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ShieldCheck, Save, Bot, Loader2, AlertCircle, UploadCloud, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const SectionHeader = ({ num, title }: { num: string, title: string }) => (
    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4 mb-6">
        <span className="flex items-center justify-center size-8 rounded-full bg-emerald-100 text-emerald-600 text-sm font-bold border border-emerald-200">{num}</span>
        {title}
    </h3>
);

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="text-sm font-bold text-slate-700 block mb-2">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const Input = (props: any) => (
    <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium disabled:opacity-70 disabled:bg-slate-50 disabled:cursor-not-allowed" {...props} />
);

const Select = ({ children, ...props }: any) => (
    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all appearance-none font-medium" {...props}>
        {children}
    </select>
);

const Textarea = (props: any) => (
    <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium" {...props} />
);

export default function StartupPublishForm() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isKycVerified, setIsKycVerified] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
            if (currentUser?.email) {
                // Fetch from KYC documents table first
                const { data: kycData, error } = await supabase
                    .from('kyc_documents')
                    .select('name')
                    .eq('email', currentUser.email)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) console.error("KYC fetch error:", error);

                if (kycData?.name) {
                    setFormData(prev => ({ ...prev, founderName: kycData.name }));
                    setIsKycVerified(true);
                } else if (currentUser?.user_metadata?.kycStatus === 'Approved') {
                    const kycName = currentUser.user_metadata.kyc_name;
                    if (kycName) {
                        setFormData(prev => ({ ...prev, founderName: kycName }));
                        setIsKycVerified(true);
                    }
                }
            }
        };
        fetchUser();
    }, [supabase]);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // Section 1
        logo: null as File | null,
        logoPreview: "",
        startupName: "",
        startupTagline: "",

        // Section 2
        founderName: "",
        founderAge: "",
        founderRole: "Founder",
        founderPhoto: null as File | null,
        founderPhotoPreview: "",
        founderLinkedin: "",
        teamMembers: [] as { photo: File | null, photoPreview: string, name: string, role: string, linkedin: string }[],

        // Section 3
        industry: "FinTech",
        companyType: "Private Ltd",
        startupStage: "Seed",
        yearFounded: new Date().getFullYear().toString(),
        headquarters: "",
        website: "",

        // Section 4
        businessModel: "B2B",
        revenueModel: "Subscription",
        targetMarket: "",
        problemStatement: "",
        solution: "",
        uvp: "",
        competitors: "",
        startupDescription: "",

        // Section 5
        investmentRequired: "",
        equityOffered: "",
        currentValuation: "",
        useOfFunds: {
            productDevelopment: false, hiring: false, marketing: false, infrastructure: false, expansion: false, operations: false, other: false
        },

        // Section 6
        monthlyRevenue: "",
        monthlyExpenses: "",
        monthlyProfitLoss: "",
        cashInBank: "",
        monthlyBurnRate: "",
        runway: "",

        // Section 7
        totalCustomers: "",
        monthlyActiveUsers: "",
        monthlyGrowth: "",
        customerRetention: "",
        repeatCustomers: "",

        // Section 8
        verification: {
            gstRegistered: false, companyPanVerified: false, bankAccountVerified: false, startupIndiaRegistered: false, msmeRegistered: false, patentFiled: false, patentGranted: false
        },

        // Section 9
        pendingLegalCases: false,
        outstandingLoans: false,
        previousFundingRaised: false,
        fundingAmount: "",
        investorName: "",
        fundingRound: "",

        // Section 10
        pitchVideos: [""],

        // Section 11: Payment Details
        paymentMethod: "UPI",
        upiId: "",
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",

        // Confirmation
        confirmed: false
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedField = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev as any)[section],
                [field]: value
            }
        }));
    };

    // Derived Financials Calculations
    useEffect(() => {
        const rev = Number(formData.monthlyRevenue) || 0;
        const exp = Number(formData.monthlyExpenses) || 0;
        const cash = Number(formData.cashInBank) || 0;

        const profitLoss = rev - exp;
        const burnRate = Math.max(0, exp - rev);
        const runwayValue = burnRate > 0 ? (cash / burnRate) : (cash > 0 ? 999 : 0);

        setFormData(prev => ({
            ...prev,
            monthlyProfitLoss: profitLoss.toString(),
            monthlyBurnRate: burnRate.toString(),
            runway: runwayValue.toFixed(1)
        }));
    }, [formData.monthlyRevenue, formData.monthlyExpenses, formData.cashInBank]);

    // Derived Valuation
    useEffect(() => {
        const req = Number(formData.investmentRequired) || 0;
        const eq = Number(formData.equityOffered) || 0;
        if (req > 0 && eq > 0) {
            const val = req / (eq / 100);
            setFormData(prev => ({ ...prev, currentValuation: val.toString() }));
        } else {
            setFormData(prev => ({ ...prev, currentValuation: "" }));
        }
    }, [formData.investmentRequired, formData.equityOffered]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5 MB limit.");
                return;
            }
            if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
                alert("Only PNG, JPG, and JPEG are allowed.");
                return;
            }
            const previewUrl = URL.createObjectURL(file);
            
            if (field === 'logo') {
                updateField('logo', file);
                updateField('logoPreview', previewUrl);
            } else if (field === 'founder') {
                updateField('founderPhoto', file);
                updateField('founderPhotoPreview', previewUrl);
            } else if (field === 'team' && index !== undefined) {
                const newTeam = [...formData.teamMembers];
                newTeam[index].photo = file;
                newTeam[index].photoPreview = previewUrl;
                updateField('teamMembers', newTeam);
            }
        }
    };

    const addTeamMember = () => {
        if (formData.teamMembers.length < 4) {
            updateField('teamMembers', [...formData.teamMembers, { photo: null, photoPreview: "", name: "", role: "Co-Founder", linkedin: "" }]);
        }
    };

    const removeTeamMember = (index: number) => {
        const newTeam = [...formData.teamMembers];
        newTeam.splice(index, 1);
        updateField('teamMembers', newTeam);
    };

    const updateTeamMember = (index: number, field: string, value: string) => {
        const newTeam = [...formData.teamMembers];
        (newTeam[index] as any)[field] = value;
        updateField('teamMembers', newTeam);
    };

    const uploadFileToSupabase = async (file: File) => {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { data, error } = await supabase.storage.from('startup').upload(`startups/${fileName}`, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('startup').getPublicUrl(`startups/${fileName}`);
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            // Upload images first
            let uploadedLogo = "";
            let uploadedFounder = "";
            let uploadedTeam = [...formData.teamMembers];

            if (formData.logo) uploadedLogo = await uploadFileToSupabase(formData.logo);
            if (formData.founderPhoto) uploadedFounder = await uploadFileToSupabase(formData.founderPhoto);
            
            for (let i = 0; i < uploadedTeam.length; i++) {
                if (uploadedTeam[i].photo) {
                    uploadedTeam[i].photoPreview = await uploadFileToSupabase(uploadedTeam[i].photo!);
                }
            }

            const payload = {
                ...formData,
                logoUrl: uploadedLogo,
                founderPhotoUrl: uploadedFounder,
                teamMembersData: uploadedTeam.map(t => ({ name: t.name, role: t.role, linkedin: t.linkedin, photoUrl: t.photoPreview })),
                isStudent: false
            };

            const res = await fetch('/api/startups/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to publish startup');
            }
            setSuccess(true);
        } catch (err: any) {
            console.error("Publish error:", err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-5xl min-h-screen">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 lg:p-10 relative overflow-hidden text-center">
                    <div className="size-24 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mb-8 mx-auto">
                        <Save className="size-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Profile Published!</h2>
                    <p className="text-slate-500 max-w-md mx-auto text-lg">Your startup is now live. Investors can discover and review your profile.</p>
                    <button onClick={() => router.push('/investors/search')} className="mt-10 px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg">
                        View Startups
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl min-h-screen bg-slate-50/50">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Publish Your Startup</h1>
                <p className="text-slate-500">Complete your startup profile to make it visible to investors. All information is securely stored and verified before being displayed.</p>
                <div className="text-right text-xs text-red-500 mt-2 font-medium">* Required fields</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* 1. Company Branding */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="1" title="Company Branding" />
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="col-span-1">
                            <Label required>Company Logo</Label>
                            <div className="mt-2">
                                <input type="file" id="logo-upload" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} required={!formData.logo} />
                                <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors cursor-pointer overflow-hidden relative group">
                                    {formData.logoPreview ? (
                                        <img src={formData.logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <UploadCloud className="size-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-emerald-600 font-bold text-sm block">Upload Logo</span>
                                            <span className="text-xs text-slate-400 mt-1 block">PNG, JPG up to 5MB</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div className="col-span-2 space-y-6">
                            <div>
                                <Label required>Startup Name</Label>
                                <Input required placeholder="e.g. InVolution AI" value={formData.startupName} onChange={(e: any) => updateField('startupName', e.target.value)} />
                            </div>
                            <div>
                                <Label required>Startup Tagline</Label>
                                <Input required placeholder="e.g. AI-powered platform connecting startups with investors" maxLength={120} value={formData.startupTagline} onChange={(e: any) => updateField('startupTagline', e.target.value)} />
                                <div className="text-right text-xs text-slate-400 mt-1">{formData.startupTagline.length}/120</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Founder & Team */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm space-y-10">
                    <div>
                        <SectionHeader num="2" title="Founder Information" />
                        <div className="grid md:grid-cols-2 gap-6">
                            <div><Label required>Founder Name</Label><Input required placeholder="e.g. Sohan S Salian" value={formData.founderName} onChange={(e: any) => updateField('founderName', e.target.value)} disabled={isKycVerified} title={isKycVerified ? "Your verified Legal Name cannot be changed" : ""} /></div>
                            <div><Label required>Founder Age</Label><Input type="number" required placeholder="e.g. 24" value={formData.founderAge} onChange={(e: any) => updateField('founderAge', e.target.value)} /></div>
                            <div>
                                <Label required>Founder Role</Label>
                                <Select required value={formData.founderRole} onChange={(e: any) => updateField('founderRole', e.target.value)}>
                                    <option value="Founder">Founder</option><option value="CEO">CEO</option><option value="Co-Founder">Co-Founder</option><option value="CTO">CTO</option><option value="COO">COO</option><option value="CFO">CFO</option><option value="CMO">CMO</option><option value="Managing Director">Managing Director</option><option value="Director">Director</option><option value="President">President</option><option value="Other">Other</option>
                                </Select>
                            </div>
                            <div className="md:row-span-2">
                                <Label required>Founder Photo</Label>
                                <input type="file" id="founder-upload" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileUpload(e, 'founder')} required={!formData.founderPhoto} />
                                <label htmlFor="founder-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors cursor-pointer overflow-hidden mt-2">
                                    {formData.founderPhotoPreview ? (
                                        <img src={formData.founderPhotoPreview} alt="Founder Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <UploadCloud className="size-6 text-indigo-500 mx-auto mb-1" />
                                            <span className="text-indigo-600 font-bold text-xs block">Upload Photo</span>
                                            <span className="text-[10px] text-slate-400 mt-0.5 block">PNG, JPG up to 5MB</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                            <div><Label>LinkedIn (Optional)</Label><Input type="url" placeholder="https://linkedin.com/in/yourprofile" value={formData.founderLinkedin} onChange={(e: any) => updateField('founderLinkedin', e.target.value)} /></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-8">
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Team Members</h4>
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 mb-6">
                            <AlertCircle className="size-5 text-indigo-500 shrink-0" />
                            <p className="text-sm text-indigo-900 font-medium">Team Size: Minimum 1 member (Founder only) Maximum 5 members (including Founder). Add team members below (You can add up to {4 - formData.teamMembers.length} more members).</p>
                        </div>

                        {formData.teamMembers.map((member, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-6 relative">
                                <button type="button" onClick={() => removeTeamMember(idx)} className="absolute top-4 right-4 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-200 transition-colors"><X className="size-4"/></button>
                                <h5 className="font-bold text-slate-700 mb-4">Team Member {idx + 1}</h5>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><Label required>Full Name</Label><Input required placeholder="e.g. Rahul Shetty" value={member.name} onChange={(e: any) => updateTeamMember(idx, 'name', e.target.value)} /></div>
                                    <div>
                                        <Label required>Role</Label>
                                        <Select required value={member.role} onChange={(e: any) => updateTeamMember(idx, 'role', e.target.value)}>
                                            <option value="Co-Founder">Co-Founder</option><option value="CTO">CTO</option><option value="COO">COO</option><option value="CFO">CFO</option><option value="CMO">CMO</option><option value="Product Manager">Product Manager</option><option value="AI Engineer">AI Engineer</option><option value="Lead Developer">Lead Developer</option><option value="Marketing Head">Marketing Head</option><option value="Sales Head">Sales Head</option><option value="Operations Head">Operations Head</option><option value="Business Development">Business Development</option><option value="Advisor">Advisor</option><option value="Other">Other</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label required>Photo</Label>
                                        <input type="file" id={`team-upload-${idx}`} accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileUpload(e, 'team', idx)} required={!member.photo} />
                                        <label htmlFor={`team-upload-${idx}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer overflow-hidden mt-1">
                                            {member.photoPreview ? (
                                                <img src={member.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <UploadCloud className="size-5 text-indigo-400 mx-auto mb-1" />
                                                    <span className="text-indigo-600 font-bold text-xs block">Upload Photo</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    <div><Label>LinkedIn (Optional)</Label><Input type="url" placeholder="https://linkedin.com/in/yourprofile" value={member.linkedin} onChange={(e: any) => updateTeamMember(idx, 'linkedin', e.target.value)} /></div>
                                </div>
                            </div>
                        ))}

                        {formData.teamMembers.length < 4 && (
                            <button type="button" onClick={addTeamMember} className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2">
                                <Plus className="size-5" /> Add Team Member
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Company Information */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="3" title="Company Information" />
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="col-span-1">
                            <Label required>Industry / Sector</Label>
                            <Select required value={formData.industry} onChange={(e: any) => updateField('industry', e.target.value)}>
                                <option value="FinTech">FinTech</option><option value="HealthTech">HealthTech</option><option value="EdTech">EdTech</option><option value="SaaS">SaaS</option><option value="E-commerce">E-commerce</option><option value="AI/ML">AI/ML</option><option value="CleanTech">CleanTech</option><option value="DeepTech">DeepTech</option><option value="Other">Other</option>
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <Label required>Company Type</Label>
                            <Select required value={formData.companyType} onChange={(e: any) => updateField('companyType', e.target.value)}>
                                <option value="Private Ltd">Private Ltd</option><option value="LLP">LLP</option><option value="Sole Proprietorship">Sole Proprietorship</option><option value="Inc">Inc</option><option value="Public Ltd">Public Ltd</option>
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <Label required>Startup Stage</Label>
                            <Select required value={formData.startupStage} onChange={(e: any) => updateField('startupStage', e.target.value)}>
                                <option value="Ideation">Ideation</option><option value="Prototype">Prototype</option><option value="Pre-Seed">Pre-Seed</option><option value="Seed">Seed</option><option value="Series A">Series A</option><option value="Series B+">Series B+</option>
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <Label required>Year Founded</Label>
                            <Select required value={formData.yearFounded} onChange={(e: any) => updateField('yearFounded', e.target.value)}>
                                {Array.from({length: 15}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                            </Select>
                        </div>
                        <div className="col-span-2"><Label required>Headquarters</Label><Input required placeholder="e.g. Bangalore, Karnataka" value={formData.headquarters} onChange={(e: any) => updateField('headquarters', e.target.value)} /></div>
                        <div className="col-span-2"><Label>Company Website (Optional)</Label><Input type="url" placeholder="https://yourcompany.com" value={formData.website} onChange={(e: any) => updateField('website', e.target.value)} /></div>
                    </div>
                </div>

                {/* 4. Business Details */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="4" title="Business Details" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label required>Business Model</Label>
                            <Select required value={formData.businessModel} onChange={(e: any) => updateField('businessModel', e.target.value)}>
                                <option value="B2B">B2B</option><option value="B2C">B2C</option><option value="B2B2C">B2B2C</option><option value="D2C">D2C</option><option value="Marketplace">Marketplace</option>
                            </Select>
                        </div>
                        <div>
                            <Label required>Revenue Model</Label>
                            <Select required value={formData.revenueModel} onChange={(e: any) => updateField('revenueModel', e.target.value)}>
                                <option value="Subscription">Subscription</option><option value="One-time Sales">One-time Sales</option><option value="Commission">Commission</option><option value="Freemium">Freemium</option><option value="Advertising">Advertising</option><option value="Licensing">Licensing</option>
                            </Select>
                        </div>
                        <div className="col-span-2"><Label required>Target Market</Label><Input required placeholder="e.g. SMEs in India" value={formData.targetMarket} onChange={(e: any) => updateField('targetMarket', e.target.value)} /></div>
                        <div><Label required>Problem Statement</Label><Textarea required rows={3} placeholder="What problem does your startup solve?" value={formData.problemStatement} onChange={(e: any) => updateField('problemStatement', e.target.value)} /></div>
                        <div><Label required>Solution</Label><Textarea required rows={3} placeholder="How does your startup solve this problem?" value={formData.solution} onChange={(e: any) => updateField('solution', e.target.value)} /></div>
                        <div className="col-span-2"><Label required>Unique Value Proposition (UVP)</Label><Textarea required rows={2} placeholder="What makes your startup unique?" value={formData.uvp} onChange={(e: any) => updateField('uvp', e.target.value)} /></div>
                        <div><Label required>Competitors</Label><Textarea required rows={3} placeholder="Who are your main competitors?" value={formData.competitors} onChange={(e: any) => updateField('competitors', e.target.value)} /></div>
                        <div><Label required>Startup Description</Label><Textarea required rows={3} placeholder="Describe your startup, vision, and future goals." value={formData.startupDescription} onChange={(e: any) => updateField('startupDescription', e.target.value)} /></div>
                    </div>
                </div>

                {/* 5. Investment Details */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="5" title="Investment Details" />
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div><Label required>Investment Required (₹)</Label><Input type="number" required placeholder="e.g. 5000000" value={formData.investmentRequired} onChange={(e: any) => updateField('investmentRequired', e.target.value)} /></div>
                        <div><Label required>Equity Offered (%)</Label><Input type="number" required placeholder="e.g. 10" value={formData.equityOffered} onChange={(e: any) => updateField('equityOffered', e.target.value)} /></div>
                        <div><Label required>Current Valuation (₹)</Label><Input type="number" required disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold" value={formData.currentValuation} placeholder="Auto-calculated" /></div>
                    </div>
                    <div>
                        <Label required>Use of Funds</Label>
                        <div className="flex flex-wrap gap-4 mt-3">
                            {['productDevelopment', 'hiring', 'marketing', 'infrastructure', 'expansion', 'operations', 'other'].map(key => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="size-4 accent-emerald-500 rounded" checked={(formData.useOfFunds as any)[key]} onChange={(e) => updateNestedField('useOfFunds', key, e.target.checked)} />
                                    <span className="text-sm text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. Financial Details */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="6" title="Financial Details (Monthly)" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <div><Label required>Monthly Revenue (₹)</Label><Input type="number" required placeholder="e.g. 500000" value={formData.monthlyRevenue} onChange={(e: any) => updateField('monthlyRevenue', e.target.value)} /></div>
                        <div><Label required>Monthly Expenses (₹)</Label><Input type="number" required placeholder="e.g. 300000" value={formData.monthlyExpenses} onChange={(e: any) => updateField('monthlyExpenses', e.target.value)} /></div>
                        <div><Label required>Monthly Profit / Loss (₹)</Label><Input type="number" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold" value={formData.monthlyProfitLoss} placeholder="Auto-calculated" /></div>
                        <div><Label required>Cash in Bank (₹)</Label><Input type="number" required placeholder="e.g. 10000000" value={formData.cashInBank} onChange={(e: any) => updateField('cashInBank', e.target.value)} /></div>
                        <div><Label required>Monthly Burn Rate (₹)</Label><Input type="number" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold" value={formData.monthlyBurnRate} placeholder="Auto-calculated" /></div>
                        <div><Label required>Runway (Months)</Label><Input type="text" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold" value={formData.runway === '999' ? '∞' : formData.runway} placeholder="Auto-calculated" /></div>
                    </div>
                </div>

                {/* 7. Growth Metrics */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="7" title="Growth Metrics" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <div><Label required>Total Customers</Label><Input type="number" required placeholder="e.g. 1000" value={formData.totalCustomers} onChange={(e: any) => updateField('totalCustomers', e.target.value)} /></div>
                        <div><Label required>Monthly Active Users</Label><Input type="number" required placeholder="e.g. 5000" value={formData.monthlyActiveUsers} onChange={(e: any) => updateField('monthlyActiveUsers', e.target.value)} /></div>
                        <div><Label required>Monthly Growth (%)</Label><Input type="number" required placeholder="e.g. 20" value={formData.monthlyGrowth} onChange={(e: any) => updateField('monthlyGrowth', e.target.value)} /></div>
                        <div><Label required>Customer Retention (%)</Label><Input type="number" required placeholder="e.g. 80" value={formData.customerRetention} onChange={(e: any) => updateField('customerRetention', e.target.value)} /></div>
                        <div><Label required>Repeat Customers (%)</Label><Input type="number" required placeholder="e.g. 60" value={formData.repeatCustomers} onChange={(e: any) => updateField('repeatCustomers', e.target.value)} /></div>
                    </div>
                </div>

                {/* 8. Business Verification */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="8" title="Business Verification" />
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {['gstRegistered', 'companyPanVerified', 'bankAccountVerified', 'startupIndiaRegistered', 'msmeRegistered', 'patentFiled', 'patentGranted'].map(key => (
                            <label key={key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input type="checkbox" className="size-4 accent-emerald-500 rounded" checked={(formData.verification as any)[key]} onChange={(e) => updateNestedField('verification', key, e.target.checked)} />
                                <span className="text-sm font-semibold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 9. Risk Disclosure */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="9" title="Risk Disclosure" />
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <Label required>Any Pending Legal Cases?</Label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="legal" className="accent-emerald-500" checked={formData.pendingLegalCases} onChange={() => updateField('pendingLegalCases', true)}/> <span className="text-sm font-medium">Yes</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="legal" className="accent-emerald-500" checked={!formData.pendingLegalCases} onChange={() => updateField('pendingLegalCases', false)}/> <span className="text-sm font-medium">No</span></label>
                                </div>
                            </div>
                            <div>
                                <Label required>Any Outstanding Loans?</Label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="loans" className="accent-emerald-500" checked={formData.outstandingLoans} onChange={() => updateField('outstandingLoans', true)}/> <span className="text-sm font-medium">Yes</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="loans" className="accent-emerald-500" checked={!formData.outstandingLoans} onChange={() => updateField('outstandingLoans', false)}/> <span className="text-sm font-medium">No</span></label>
                                </div>
                            </div>
                            <div>
                                <Label required>Previous Funding Raised?</Label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="funding" className="accent-emerald-500" checked={formData.previousFundingRaised} onChange={() => updateField('previousFundingRaised', true)}/> <span className="text-sm font-medium">Yes</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="funding" className="accent-emerald-500" checked={!formData.previousFundingRaised} onChange={() => updateField('previousFundingRaised', false)}/> <span className="text-sm font-medium">No</span></label>
                                </div>
                            </div>
                        </div>
                        
                        {formData.previousFundingRaised && (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                <h4 className="font-bold text-slate-800 mb-4">If Yes, Provide Details</h4>
                                <div><Label required>Funding Amount (₹)</Label><Input required placeholder="e.g. 10000000" value={formData.fundingAmount} onChange={(e: any) => updateField('fundingAmount', e.target.value)} /></div>
                                <div><Label required>Investor Name</Label><Input required placeholder="e.g. Angel Investor" value={formData.investorName} onChange={(e: any) => updateField('investorName', e.target.value)} /></div>
                                <div><Label required>Funding Round</Label><Input required placeholder="e.g. Seed Round" value={formData.fundingRound} onChange={(e: any) => updateField('fundingRound', e.target.value)} /></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 10. Pitch Media */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="10" title="Pitch Media" />
                    <div className="space-y-4">
                        <Label required>Pitch Video (YouTube Unlisted)</Label>
                        {formData.pitchVideos.map((vid, idx) => (
                            <div key={idx} className="flex gap-3">
                                <Input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={vid} onChange={(e: any) => {
                                    const newVids = [...formData.pitchVideos];
                                    newVids[idx] = e.target.value;
                                    updateField('pitchVideos', newVids);
                                }} />
                                {formData.pitchVideos.length > 1 && (
                                    <button type="button" onClick={() => {
                                        const newVids = [...formData.pitchVideos];
                                        newVids.splice(idx, 1);
                                        updateField('pitchVideos', newVids);
                                    }} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-100 font-bold transition-colors"><X className="size-5"/></button>
                                )}
                            </div>
                        ))}
                        <p className="text-xs text-slate-500">Add links to your pitch videos. You can add multiple videos.</p>
                        <button type="button" onClick={() => updateField('pitchVideos', [...formData.pitchVideos, ""])} className="mt-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
                            <Plus className="size-4" /> Add Another Video
                        </button>
                    </div>
                </div>

                {/* 11. Payment Details */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm mb-8">
                    <SectionHeader num="11" title="Payment Details" />
                    <p className="text-sm text-slate-500 mb-6">These payment details will be used during the Smart Agreement process. Please provide accurate information. If you are receiving investment funds, investors will use these details to transfer the agreed investment amount.</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1">
                            <Label required>Preferred Payment Method</Label>
                            <Select required value={formData.paymentMethod} onChange={(e: any) => {
                                updateField('paymentMethod', e.target.value);
                            }}>
                                <option value="UPI">UPI</option>
                                <option value="Bank Account">Bank Account</option>
                            </Select>
                        </div>
                    </div>
                    {formData.paymentMethod === "UPI" ? (
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div><Label required>UPI ID</Label><Input required placeholder="e.g. abcstartup@okaxis" value={formData.upiId} onChange={(e: any) => updateField('upiId', e.target.value)} /></div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div><Label required>Account Holder Name</Label><Input required placeholder="e.g. HealthSync Inc" value={formData.accountHolderName} onChange={(e: any) => updateField('accountHolderName', e.target.value)} /></div>
                            <div><Label required>Bank Name</Label><Input required placeholder="e.g. HDFC Bank" value={formData.bankName} onChange={(e: any) => updateField('bankName', e.target.value)} /></div>
                            <div><Label required>Account Number</Label><Input required placeholder="e.g. 50100123456789" value={formData.accountNumber} onChange={(e: any) => updateField('accountNumber', e.target.value)} /></div>
                            <div><Label required>IFSC Code</Label><Input required placeholder="e.g. HDFC0001234" value={formData.ifscCode} onChange={(e: any) => updateField('ifscCode', e.target.value)} /></div>
                        </div>
                    )}
                </div>

                {/* Final Confirmation */}
                <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" required className="size-5 accent-emerald-600 rounded" checked={formData.confirmed} onChange={(e) => updateField('confirmed', e.target.checked)} />
                        <div>
                            <span className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-600"/> Final Confirmation</span>
                            <span className="text-sm text-slate-500 mt-1 block">I confirm that all information provided is accurate and true to the best of my knowledge.</span>
                        </div>
                    </label>
                    <button type="submit" disabled={saving || !formData.confirmed} className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg whitespace-nowrap">
                        {saving ? <><Loader2 className="size-5 animate-spin" /> Publishing...</> : "Publish Startup Profile"}
                    </button>
                </div>
            </form>
        </div>
    );
}
