"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { 
    Rocket, UploadCloud, Plus, Trash2, ShieldCheck, 
    CheckCircle2, AlertCircle, Save, Loader2 
} from "lucide-react";

// ---------------------------------------------------------
// REUSABLE UI COMPONENTS
// ---------------------------------------------------------

const SectionHeader = ({ num, title }: { num: string, title: string }) => (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
        <span className="flex items-center justify-center size-8 rounded-full bg-blue-600 text-white text-sm font-bold shadow-sm">{num}</span>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
    </div>
);

const Label = ({ children, required, subtitle }: { children: React.ReactNode, required?: boolean, subtitle?: string }) => (
    <label className="block mb-1.5">
        <span className="text-sm font-bold text-slate-800">{children} {required && <span className="text-red-500">*</span>}</span>
        {subtitle && <span className="block text-xs text-slate-500 mt-0.5">{subtitle}</span>}
    </label>
);

const Input = (props: any) => (
    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed" {...props} />
);

const Select = ({ children, ...props }: any) => (
    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none font-medium text-sm" {...props}>
        {children}
    </select>
);

const Textarea = (props: any) => (
    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm resize-y" {...props} />
);

const CheckboxLabel = ({ label, checked, onChange, required }: { label: string, checked: boolean, onChange: (c: boolean) => void, required?: boolean }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
        <div className="pt-0.5">
            <input type="checkbox" className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={checked} onChange={(e) => onChange(e.target.checked)} required={required} />
        </div>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 leading-snug">{label} {required && <span className="text-red-500">*</span>}</span>
    </label>
);

const RadioGroup = ({ options, value, onChange, name }: { options: {label: string, value: boolean}[], value: boolean, onChange: (v: boolean) => void, name: string }) => (
    <div className="flex items-center gap-6">
        {options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name={name} className="size-4 border-slate-300 text-blue-600 focus:ring-blue-500" checked={value === opt.value} onChange={() => onChange(opt.value)} />
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{opt.label}</span>
            </label>
        ))}
    </div>
);

// ---------------------------------------------------------
// MAIN PAGE COMPONENT
// ---------------------------------------------------------

export default function IncubationForm() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isKycVerified, setIsKycVerified] = useState(false);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Form State
    const [formData, setFormData] = useState({
        // Section 1
        founderPhoto: null as File | null, founderPhotoPreview: "",
        fullName: "", email: "", phoneNumber: "", city: "", state: "",
        shortBio: "", linkedinUrl: "", githubUrl: "",
        teamMembers: [] as { photo: File | null, photoPreview: string, name: string, role: string, bio: string }[],

        // Section 2
        institutionName: "", educationType: "",
        course: "", branch: "", semester: "", graduationYear: "",
        schoolClass: "", schoolBoard: "",
        diplomaCourse: "", diplomaBranch: "", studentIdUrl: "",

        // Section 3
        ideaLogoPhoto: null as File | null, ideaLogoUrl: "",
        projectName: "", tagline: "", industry: "",
        problemStatement: "", solutionDescription: "", innovationUsp: "", targetUsers: "", currentStage: "",

        // Section 4
        prototypeAvailable: false, prototypeLink: "", githubRepo: "", website: "", technologyUsed: [] as string[],

        // Section 5
        validatedIdea: false,
        testUsersCount: "", pilotTesting: "", mentorFeedback: "", hackathonParticipation: "", prototypeDemo: "", otherValidation: "",

        // Section 6
        supportNeeded: [] as string[],
        fundingRequired: false, askAmount: "", equityOffered: "", fundUtilization: [] as string[],

        // Section 7
        pitchVideos: [""] as string[],

        // Section 8 (Payment Details)
        paymentMethod: "upi", upiId: "", 
        accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "",

        // Section 9 (Declarations - not sent to DB, just for UI validation)
        dec1: false, dec2: false, dec3: false, dec4: false
    });

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
                    setFormData(prev => ({ 
                        ...prev, 
                        email: currentUser.email || "",
                        fullName: kycData.name 
                    }));
                    setIsKycVerified(true);
                } else if (currentUser?.user_metadata?.kycStatus === 'Approved') {
                    const kycName = currentUser.user_metadata.kyc_name;
                    if (kycName) {
                        setFormData(prev => ({ ...prev, fullName: kycName }));
                        setIsKycVerified(true);
                    }
                } else {
                    setFormData(prev => ({ 
                        ...prev, 
                        email: currentUser.email || ""
                    }));
                }
            }
        };
        fetchUser();
    }, [supabase]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArray = (field: 'technologyUsed' | 'supportNeeded' | 'fundUtilization', value: string) => {
        setFormData(prev => {
            const arr = prev[field];
            if (arr.includes(value)) {
                return { ...prev, [field]: arr.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...arr, value] };
            }
        });
    };

    // FILE UPLOAD HANDLERS
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'founder' | 'logo', index?: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) return alert("File size exceeds 5 MB limit.");
            const previewUrl = URL.createObjectURL(file);
            
            if (field === 'founder') {
                updateField('founderPhoto', file);
                updateField('founderPhotoPreview', previewUrl);
            } else if (field === 'logo') {
                updateField('ideaLogoPhoto', file);
                updateField('ideaLogoUrl', previewUrl);
            }
        }
    };

    const handleTeamPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) return alert("File size exceeds 5 MB limit.");
            const previewUrl = URL.createObjectURL(file);
            const newTeam = [...formData.teamMembers];
            newTeam[index].photo = file;
            newTeam[index].photoPreview = previewUrl;
            updateField('teamMembers', newTeam);
        }
    };

    const uploadFileToSupabase = async (file: File) => {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { data, error } = await supabase.storage.from('incubation').upload(`applications/${fileName}`, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('incubation').getPublicUrl(`applications/${fileName}`);
        return publicUrl;
    };

    // DYNAMIC ARRAYS
    const addTeamMember = () => {
        if (formData.teamMembers.length >= 4) return alert("Maximum 5 team members (including founder) allowed.");
        updateField('teamMembers', [...formData.teamMembers, { photo: null, photoPreview: "", name: "", role: "", bio: "" }]);
    };
    const removeTeamMember = (index: number) => {
        const newTeam = [...formData.teamMembers];
        newTeam.splice(index, 1);
        updateField('teamMembers', newTeam);
    };

    const addPitchVideo = () => updateField('pitchVideos', [...formData.pitchVideos, ""]);
    const removePitchVideo = (index: number) => {
        const vids = [...formData.pitchVideos];
        vids.splice(index, 1);
        updateField('pitchVideos', vids);
    };
    const updatePitchVideo = (index: number, val: string) => {
        const vids = [...formData.pitchVideos];
        vids[index] = val;
        updateField('pitchVideos', vids);
    };

    // CONSTANTS
    const educationTypes = ["", "School", "PUC / Higher Secondary", "Diploma", "Undergraduate Degree", "Engineering", "Postgraduate", "PhD", "Other"];
    const industries = ["", "Artificial Intelligence", "Healthcare", "Education", "Agriculture", "FinTech", "SaaS", "Cyber Security", "E-commerce", "Robotics", "IoT", "Environment", "Social Impact", "Other"];
    const stages = ["", "Idea Stage", "Research Stage", "Prototype Ready", "MVP Ready", "Beta Testing", "Early Users", "Other"];
    const techOptions = ["AI / ML", "Web Application", "Mobile App", "IoT", "Cloud", "Blockchain", "Robotics", "Data Science"];
    const supportOptions = ["Mentorship", "Technical Guidance", "Product Development", "Prototype Development", "Funding", "Cloud Credits", "Legal Guidance", "Intellectual Property Support", "Marketing Support", "Networking Opportunities", "Investor Connections", "Workspace / Office Space", "Industry Connections"];
    const fundOptions = ["Prototype Development", "Product Development", "Hardware Purchase", "Software & Tools", "Cloud Services", "Research & Development", "Marketing", "Testing", "Team Expansion", "Legal & IP Filing", "Other"];

    // SUBMIT
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            // Upload images
            let uploadedFounder = "";
            let uploadedLogo = "";
            let uploadedTeam = [...formData.teamMembers];

            if (formData.founderPhoto) uploadedFounder = await uploadFileToSupabase(formData.founderPhoto);
            if (formData.ideaLogoPhoto) uploadedLogo = await uploadFileToSupabase(formData.ideaLogoPhoto);
            
            for (let i = 0; i < uploadedTeam.length; i++) {
                if (uploadedTeam[i].photo) {
                    uploadedTeam[i].photoPreview = await uploadFileToSupabase(uploadedTeam[i].photo!);
                }
            }

            const payload = {
                ...formData,
                founderPhotoUrl: uploadedFounder,
                ideaLogoUrl: uploadedLogo,
                teamMembersData: uploadedTeam.map(t => ({ name: t.name, role: t.role, short_bio: t.bio, photoUrl: t.photoPreview }))
            };

            const res = await fetch('/api/incube/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit application');
            }
            setSuccess(true);
            window.scrollTo(0,0);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            window.scrollTo(0,0);
        } finally {
            setSaving(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 max-w-2xl text-center">
                    <div className="size-24 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mb-8 mx-auto">
                        <CheckCircle2 className="size-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
                    <p className="text-slate-500 text-lg mb-8">Thank you for applying to the incubation program. Your idea is now under review and you can track your status from your dashboard.</p>
                    <button onClick={() => router.push('/incube/dashboard')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const declarationsValid = formData.dec1 && formData.dec2 && formData.dec3 && formData.dec4;

    return (
        <div className="min-h-screen bg-[#f4f7f9] py-12 px-4 md:px-6">
            <div className="container mx-auto max-w-6xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-sm">
                        <Rocket className="size-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Incubation Application Form</h1>
                        <p className="text-slate-500 mt-1">Fill in the details below to apply for our incubation program.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* 1. FOUNDER & TEAM */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="1" title="Founder & Team Information" />
                        
                        <div className="mb-6"><h4 className="font-bold text-blue-600 text-sm">Founder Details</h4></div>
                        
                        <div className="grid md:grid-cols-12 gap-8 mb-10">
                            {/* Photo Upload Box */}
                            <div className="md:col-span-3">
                                <Label required subtitle="1:1 (Square), Max 5MB">Founder Photo</Label>
                                <input type="file" id="founder-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'founder')} required={!formData.founderPhoto} />
                                <label htmlFor="founder-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group">
                                    {formData.founderPhotoPreview ? (
                                        <img src={formData.founderPhotoPreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-4">
                                            <UploadCloud className="size-8 text-slate-400 mb-2 group-hover:text-blue-500" />
                                            <span className="text-sm font-bold text-slate-700">Upload Photo</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Details */}
                            <div className="md:col-span-9 grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-1"><Label required>Full Name</Label><Input required value={formData.fullName} onChange={(e:any)=>updateField('fullName', e.target.value)} disabled={isKycVerified} title={isKycVerified ? "Your verified Legal Name cannot be changed" : ""} /></div>
                                <div className="md:col-span-1"><Label required>Email</Label><Input type="email" required disabled value={formData.email} className="bg-slate-100 text-slate-500 cursor-not-allowed" /></div>
                                <div className="md:col-span-1"><Label required>Phone Number</Label><Input type="tel" required value={formData.phoneNumber} onChange={(e:any)=>updateField('phoneNumber', e.target.value)} /></div>
                                
                                <div className="md:col-span-1"><Label required>City</Label><Input required value={formData.city} onChange={(e:any)=>updateField('city', e.target.value)} /></div>
                                <div className="md:col-span-1"><Label required>State</Label><Input required value={formData.state} onChange={(e:any)=>updateField('state', e.target.value)} /></div>
                                <div className="md:col-span-1"></div>

                                <div className="md:col-span-3"><Label required>Short Bio / About Yourself</Label><Textarea rows={2} required value={formData.shortBio} onChange={(e:any)=>updateField('shortBio', e.target.value)} /></div>
                                
                                <div className="md:col-span-1 md:col-start-1"><Label>LinkedIn Profile (Optional)</Label><Input type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedinUrl} onChange={(e:any)=>updateField('linkedinUrl', e.target.value)} /></div>
                                <div className="md:col-span-1"><Label>GitHub / Portfolio (Optional)</Label><Input type="url" placeholder="https://github.com/..." value={formData.githubUrl} onChange={(e:any)=>updateField('githubUrl', e.target.value)} /></div>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-8 mb-6">
                            <div>
                                <h4 className="font-bold text-blue-600 text-sm">Team Members</h4>
                                <p className="text-xs text-slate-500 mt-1">Minimum: Founder only | Maximum: 5 Members (including Founder)</p>
                            </div>
                            <button type="button" onClick={addTeamMember} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
                                <Plus className="size-4" /> Add Team Member
                            </button>
                        </div>

                        {formData.teamMembers.map((member, i) => (
                            <div key={i} className="grid md:grid-cols-12 gap-6 items-start p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-4 relative group">
                                <div className="md:col-span-2">
                                    <Label required subtitle="1:1 (Square)">Photo</Label>
                                    <input type="file" id={`team-upload-${i}`} accept="image/*" className="hidden" onChange={(e) => handleTeamPhotoUpload(e, i)} required={!member.photo} />
                                    <label htmlFor={`team-upload-${i}`} className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-white transition-colors overflow-hidden">
                                        {member.photoPreview ? <img src={member.photoPreview} className="w-full h-full object-cover" /> : <UploadCloud className="size-6 text-slate-400" />}
                                    </label>
                                </div>
                                <div className="md:col-span-3"><Label required>Full Name</Label><Input required value={member.name} onChange={(e:any) => { const nt = [...formData.teamMembers]; nt[i].name = e.target.value; updateField('teamMembers', nt); }} /></div>
                                <div className="md:col-span-3"><Label required>Role in the Team</Label><Input required value={member.role} onChange={(e:any) => { const nt = [...formData.teamMembers]; nt[i].role = e.target.value; updateField('teamMembers', nt); }} /></div>
                                <div className="md:col-span-4"><Label required>Short Bio / Skills</Label><Textarea required rows={2} value={member.bio} onChange={(e:any) => { const nt = [...formData.teamMembers]; nt[i].bio = e.target.value; updateField('teamMembers', nt); }} /></div>
                                
                                <button type="button" onClick={() => removeTeamMember(i)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 bg-white p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* 2. EDUCATION */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="2" title="Educational Background" />
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div><Label required>Institution Name</Label><Input required value={formData.institutionName} onChange={(e:any)=>updateField('institutionName', e.target.value)} /></div>
                            <div>
                                <Label required>Education Type</Label>
                                <Select required value={formData.educationType} onChange={(e:any)=>updateField('educationType', e.target.value)}>
                                    {educationTypes.map(et => <option key={et} value={et}>{et || "Select education type"}</option>)}
                                </Select>
                            </div>
                        </div>

                        {/* Conditional Rendering based on Education Type */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {(['Undergraduate Degree', 'Engineering', 'Postgraduate', 'PhD', 'Other'].includes(formData.educationType)) && (
                                <>
                                    <div className="col-span-2"><h4 className="text-xs font-bold text-blue-600 uppercase">If Undergraduate / Engineering / Postgraduate is selected</h4></div>
                                    <div><Label required>Course / Degree</Label><Input required value={formData.course} onChange={(e:any)=>updateField('course', e.target.value)} /></div>
                                    <div><Label required>Branch / Specialization</Label><Input required value={formData.branch} onChange={(e:any)=>updateField('branch', e.target.value)} /></div>
                                    <div><Label required>Current Year / Semester</Label><Input required value={formData.semester} onChange={(e:any)=>updateField('semester', e.target.value)} /></div>
                                    <div><Label required>Graduation Year</Label><Input required type="number" value={formData.graduationYear} onChange={(e:any)=>updateField('graduationYear', e.target.value)} /></div>
                                </>
                            )}
                            
                            {formData.educationType === 'School' && (
                                <>
                                    <div className="col-span-2"><h4 className="text-xs font-bold text-green-600 uppercase">If School is selected</h4></div>
                                    <div><Label required>Class</Label><Input required value={formData.schoolClass} onChange={(e:any)=>updateField('schoolClass', e.target.value)} /></div>
                                    <div><Label required>Board</Label><Input required value={formData.schoolBoard} onChange={(e:any)=>updateField('schoolBoard', e.target.value)} /></div>
                                </>
                            )}

                            {formData.educationType === 'Diploma' && (
                                <>
                                    <div className="col-span-2"><h4 className="text-xs font-bold text-orange-600 uppercase">If Diploma is selected</h4></div>
                                    <div><Label required>Diploma Course</Label><Input required value={formData.diplomaCourse} onChange={(e:any)=>updateField('diplomaCourse', e.target.value)} /></div>
                                    <div><Label required>Branch</Label><Input required value={formData.diplomaBranch} onChange={(e:any)=>updateField('diplomaBranch', e.target.value)} /></div>
                                </>
                            )}

                            <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-100">
                                <div className="md:w-1/2"><Label>Student ID (Optional)</Label><Input value={formData.studentIdUrl} onChange={(e:any)=>updateField('studentIdUrl', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>

                    {/* 3. IDEA DETAILS */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="3" title="Idea Details" />
                        
                        <div className="grid md:grid-cols-12 gap-8 mb-6">
                            <div className="md:col-span-3">
                                <Label required subtitle="1:1 (Square), Max 5MB">Idea Logo</Label>
                                <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} required={!formData.ideaLogoPhoto} />
                                <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group">
                                    {formData.ideaLogoUrl ? (
                                        <img src={formData.ideaLogoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-4">
                                            <UploadCloud className="size-8 text-slate-400 mb-2 group-hover:text-blue-500" />
                                            <span className="text-sm font-bold text-slate-700">Upload Logo</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                            <div className="md:col-span-9 grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-1"><Label required>Idea Name</Label><Input required value={formData.projectName} onChange={(e:any)=>updateField('projectName', e.target.value)} /></div>
                                <div className="md:col-span-1"><Label required>One-Line Tagline</Label><Input required value={formData.tagline} onChange={(e:any)=>updateField('tagline', e.target.value)} /></div>
                                <div className="md:col-span-1">
                                    <Label required>Industry</Label>
                                    <Select required value={formData.industry} onChange={(e:any)=>updateField('industry', e.target.value)}>
                                        {industries.map(i => <option key={i} value={i}>{i || "Select industry"}</option>)}
                                    </Select>
                                </div>
                                
                                <div className="md:col-span-1"><Label required>Problem Statement</Label><Textarea required rows={3} value={formData.problemStatement} onChange={(e:any)=>updateField('problemStatement', e.target.value)} /></div>
                                <div className="md:col-span-1"><Label required>Proposed Solution</Label><Textarea required rows={3} value={formData.solutionDescription} onChange={(e:any)=>updateField('solutionDescription', e.target.value)} /></div>
                                <div className="md:col-span-1"><Label required>Innovation / USP</Label><Textarea required rows={3} value={formData.innovationUsp} onChange={(e:any)=>updateField('innovationUsp', e.target.value)} /></div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                            <div><Label required>Target Users</Label><Input required value={formData.targetUsers} onChange={(e:any)=>updateField('targetUsers', e.target.value)} /></div>
                            <div>
                                <Label required>Current Stage</Label>
                                <Select required value={formData.currentStage} onChange={(e:any)=>updateField('currentStage', e.target.value)}>
                                    {stages.map(s => <option key={s} value={s}>{s || "Select current stage"}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* 4. PRODUCT INFORMATION */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="4" title="Product Information" />
                        
                        <div className="mb-8">
                            <Label required>Do you have a prototype?</Label>
                            <RadioGroup 
                                name="prototype"
                                options={[{label: "Yes", value: true}, {label: "No", value: false}]} 
                                value={formData.prototypeAvailable} 
                                onChange={(val) => updateField('prototypeAvailable', val)} 
                            />
                        </div>

                        {formData.prototypeAvailable && (
                            <div className="grid md:grid-cols-3 gap-6 mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="md:col-span-3"><h4 className="text-xs font-bold text-blue-600 uppercase">If Yes, please provide the details below</h4></div>
                                <div><Label required>Prototype Link</Label><Input type="url" required value={formData.prototypeLink} onChange={(e:any)=>updateField('prototypeLink', e.target.value)} /></div>
                                <div><Label>GitHub Repository (Optional)</Label><Input type="url" value={formData.githubRepo} onChange={(e:any)=>updateField('githubRepo', e.target.value)} /></div>
                                <div><Label>Website (Optional)</Label><Input type="url" value={formData.website} onChange={(e:any)=>updateField('website', e.target.value)} /></div>
                            </div>
                        )}

                        <div>
                            <Label required subtitle="(Select all that apply)">Technology Used</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 mt-4">
                                {techOptions.map(tech => (
                                    <CheckboxLabel key={tech} label={tech} checked={formData.technologyUsed.includes(tech)} onChange={() => toggleArray('technologyUsed', tech)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 5. IDEA VALIDATION */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
                            <span className="flex items-center justify-center size-8 rounded-full bg-blue-600 text-white text-sm font-bold shadow-sm">5</span>
                            <h3 className="text-xl font-bold text-slate-900">Idea Validation <span className="text-slate-400 font-medium text-lg ml-2">(Optional Section)</span></h3>
                        </div>
                        
                        <div className="mb-8">
                            <Label required>Have you validated your idea?</Label>
                            <RadioGroup 
                                name="validated"
                                options={[{label: "Yes", value: true}, {label: "No", value: false}]} 
                                value={formData.validatedIdea} 
                                onChange={(val) => updateField('validatedIdea', val)} 
                            />
                        </div>

                        {formData.validatedIdea && (
                            <div className="grid md:grid-cols-3 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="md:col-span-3"><h4 className="text-xs font-bold text-blue-600 uppercase">If Yes, please provide the details below <span className="text-slate-500 font-medium lowercase">(All fields optional)</span></h4></div>
                                <div><Label>Number of Test Users</Label><Input value={formData.testUsersCount} onChange={(e:any)=>updateField('testUsersCount', e.target.value)} /></div>
                                <div><Label>Pilot Testing Completed</Label><Input value={formData.pilotTesting} onChange={(e:any)=>updateField('pilotTesting', e.target.value)} /></div>
                                <div><Label>Any Mentor Feedback Received</Label><Input value={formData.mentorFeedback} onChange={(e:any)=>updateField('mentorFeedback', e.target.value)} /></div>
                                <div><Label>Any Competition or Hackathon Participation</Label><Input value={formData.hackathonParticipation} onChange={(e:any)=>updateField('hackathonParticipation', e.target.value)} /></div>
                                <div><Label>Prototype Demonstrated to Anyone</Label><Input value={formData.prototypeDemo} onChange={(e:any)=>updateField('prototypeDemo', e.target.value)} /></div>
                                <div><Label>Other Validation</Label><Input value={formData.otherValidation} onChange={(e:any)=>updateField('otherValidation', e.target.value)} /></div>
                            </div>
                        )}
                    </div>

                    {/* 6. INCUBATION REQUIREMENTS */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="6" title="Incubation Requirements" />
                        
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <Label required subtitle="(Select all that apply)">What kind of support are you looking for?</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 mt-4">
                                    {supportOptions.map(sup => (
                                        <CheckboxLabel key={sup} label={sup} checked={formData.supportNeeded.includes(sup)} onChange={() => toggleArray('supportNeeded', sup)} />
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <div className="mb-8">
                                    <Label required>Do you require funding?</Label>
                                    <RadioGroup 
                                        name="fundingReq"
                                        options={[{label: "Yes", value: true}, {label: "No", value: false}]} 
                                        value={formData.fundingRequired} 
                                        onChange={(val) => updateField('fundingRequired', val)} 
                                    />
                                </div>

                                {formData.fundingRequired && (
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
                                        <div><h4 className="text-xs font-bold text-blue-600 uppercase">If Yes, please provide the details below</h4></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <Label required subtitle="Value must be greater than 0">Funding Required (₹)</Label>
                                                <Input type="number" min="1" required value={formData.askAmount} onChange={(e:any)=>updateField('askAmount', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label required subtitle="Min: 0% - Max: 100% (e.g. 2.5%)">Equity Offered for Incubation (%)</Label>
                                                <Input type="number" min="0" max="100" step="0.01" required value={formData.equityOffered} onChange={(e:any)=>updateField('equityOffered', e.target.value)} />
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-slate-200">
                                            <Label required subtitle="(Select all that apply)">How will you use the funds?</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 mt-4">
                                                {fundOptions.map(f => (
                                                    <CheckboxLabel key={f} label={f} checked={formData.fundUtilization.includes(f)} onChange={() => toggleArray('fundUtilization', f)} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 7. PITCH VIDEO */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="7" title="Pitch Video" />
                        
                        <div className="space-y-4 mb-4">
                            {formData.pitchVideos.map((vid, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        {i === 0 && <Label>Pitch Video (YouTube Link)</Label>}
                                        <Input type="url" placeholder="https://youtube.com/watch?v=..." value={vid} onChange={(e:any) => updatePitchVideo(i, e.target.value)} />
                                    </div>
                                    {i > 0 && (
                                        <button type="button" onClick={() => removePitchVideo(i)} className="p-3 bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-6">
                                            <Trash2 className="size-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addPitchVideo} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
                            <Plus className="size-4" /> Add Another Pitch Video
                        </button>
                    </div>

                    {/* 8. PAYMENT DETAILS */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="8" title="Payment Details" />
                        
                        <div className="mb-6">
                            <Label required>Preferred Payment Method</Label>
                            <div className="flex gap-6 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="payment_method" value="upi" checked={formData.paymentMethod === 'upi'} onChange={(e: any) => updateField('paymentMethod', e.target.value)} className="size-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                    <span className="text-sm font-medium text-slate-700">UPI</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="payment_method" value="bank" checked={formData.paymentMethod === 'bank'} onChange={(e: any) => updateField('paymentMethod', e.target.value)} className="size-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                    <span className="text-sm font-medium text-slate-700">Bank Account</span>
                                </label>
                            </div>
                        </div>

                        {formData.paymentMethod === 'upi' ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div><Label required>UPI ID</Label><Input type="text" required value={formData.upiId} onChange={(e: any) => updateField('upiId', e.target.value)} placeholder="e.g. abc@okaxis" /></div>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div><Label required>Account Holder Name</Label><Input type="text" required value={formData.accountHolderName} onChange={(e: any) => updateField('accountHolderName', e.target.value)} placeholder="Name as per bank" /></div>
                                <div><Label required>Bank Name</Label><Input type="text" required value={formData.bankName} onChange={(e: any) => updateField('bankName', e.target.value)} placeholder="e.g. HDFC Bank" /></div>
                                <div><Label required>Account Number</Label><Input type="text" required value={formData.accountNumber} onChange={(e: any) => updateField('accountNumber', e.target.value)} placeholder="Bank Account Number" /></div>
                                <div><Label required>IFSC Code</Label><Input type="text" required value={formData.ifscCode} onChange={(e: any) => updateField('ifscCode', e.target.value)} placeholder="e.g. HDFC0001234" /></div>
                            </div>
                        )}
                    </div>

                    {/* 9. DECLARATION */}
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                        <SectionHeader num="9" title="Declaration" />
                        
                        <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxLabel required label="I confirm that this idea is my own original work." checked={formData.dec1} onChange={(v) => updateField('dec1', v)} />
                            <CheckboxLabel required label="I certify that the information provided is accurate." checked={formData.dec2} onChange={(v) => updateField('dec2', v)} />
                            <CheckboxLabel required label="I agree to the incubation program's evaluation process." checked={formData.dec3} onChange={(v) => updateField('dec3', v)} />
                            <CheckboxLabel required label="I understand that submitting this application does not guarantee selection." checked={formData.dec4} onChange={(v) => updateField('dec4', v)} />
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div className="flex justify-center pt-6">
                        <button 
                            type="submit" 
                            disabled={saving || !declarationsValid} 
                            className={`px-12 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all shadow-md 
                                ${saving || !declarationsValid ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'}`}
                        >
                            {saving ? <><Loader2 className="size-5 animate-spin" /> Submitting Application...</> : 'Submit Application'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
