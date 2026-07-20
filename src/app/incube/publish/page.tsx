"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ShieldCheck, Save, Loader2, AlertCircle, Rocket, X, Plus, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

const SectionHeader = ({ num, title }: { num: string, title: string }) => (
    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 border-b border-slate-200 pb-4 mb-6">
        <span className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold border border-blue-200">{num}</span>
        {title}
    </h3>
);

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="text-sm font-bold text-slate-700 block mb-2">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const Input = (props: any) => (
    <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium" {...props} />
);

const Select = ({ children, ...props }: any) => (
    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none font-medium" {...props}>
        {children}
    </select>
);

const Textarea = (props: any) => (
    <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium" {...props} />
);

export default function IncubePublishForm() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
            if (currentUser) {
                setFormData(prev => ({ 
                    ...prev, 
                    email: currentUser.email || "",
                    fullName: currentUser.user_metadata?.full_name || "" 
                }));
            }
        };
        fetchUser();
    }, [supabase]);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        // Section 1: Personal Info
        fullName: "",
        email: "",
        phoneNumber: "",
        shortBio: "",
        founderPhoto: null as File | null,
        founderPhotoPreview: "",
        teamMembers: [] as { photo: File | null, photoPreview: string, name: string, role: string, linkedin: string }[],

        // Section 2: Education
        institutionName: "",
        educationLevel: "College Degree",
        
        // Section 3: Project Details
        projectName: "",
        problemStatement: "",
        solutionDescription: "",
        currentStage: "Ideation",
        
        // Section 4: Equity & Investment
        equityOffered: "",
        askAmount: "",
        
        // Section 5: Pitch Media
        pitchVideos: [""],
        
        // Section 6: Additional
        additionalNotes: "",
        confirmed: false
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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
            
            if (field === 'founder') {
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
            let uploadedFounder = "";
            let uploadedTeam = [...formData.teamMembers];

            if (formData.founderPhoto) uploadedFounder = await uploadFileToSupabase(formData.founderPhoto);
            
            for (let i = 0; i < uploadedTeam.length; i++) {
                if (uploadedTeam[i].photo) {
                    uploadedTeam[i].photoPreview = await uploadFileToSupabase(uploadedTeam[i].photo!);
                }
            }

            const payload = {
                ...formData,
                founderPhotoUrl: uploadedFounder,
                teamMembersData: uploadedTeam.map(t => ({ name: t.name, role: t.role, linkedin: t.linkedin, photoUrl: t.photoPreview }))
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
                    <div className="size-24 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mb-8 mx-auto">
                        <Save className="size-12 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
                    <p className="text-slate-500 max-w-md mx-auto text-lg">Your student application is now under review. You can track your status in your dashboard.</p>
                    <button onClick={() => router.push('/incube/dashboard')} className="mt-10 px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl min-h-screen bg-slate-50/50">
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-4">
                    <Rocket className="size-4 text-blue-600" />
                    <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">Student Application</span>
                </div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Publish Your Idea</h1>
                <p className="text-slate-500">Submit your idea, prototype, or project for incubation. We don't ask for financial history—just vision and passion.</p>
                <div className="text-right text-xs text-red-500 mt-2 font-medium">* Required fields</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* 1. Personal Information */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="1" title="Founder & Team Information" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div><Label required>Full Name</Label><Input required placeholder="e.g. Rahul Sharma" value={formData.fullName} onChange={(e: any) => updateField('fullName', e.target.value)} /></div>
                        <div><Label required>Email</Label><Input type="email" required disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500" value={formData.email} /></div>
                        <div><Label>Phone Number</Label><Input type="tel" placeholder="+91 9876543210" value={formData.phoneNumber} onChange={(e: any) => updateField('phoneNumber', e.target.value)} /></div>
                        <div className="md:row-span-2">
                            <Label required>Founder Photo</Label>
                            <input type="file" id="founder-upload" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileUpload(e, 'founder')} required={!formData.founderPhoto} />
                            <label htmlFor="founder-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer overflow-hidden mt-2">
                                {formData.founderPhotoPreview ? (
                                    <img src={formData.founderPhotoPreview} alt="Founder Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-2">
                                        <UploadCloud className="size-6 text-blue-500 mx-auto mb-1" />
                                        <span className="text-blue-600 font-bold text-xs block">Upload Photo</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5 block">PNG, JPG up to 5MB</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        <div className="col-span-1"><Label>Short Bio / About Yourself</Label><Textarea rows={3} placeholder="Tell us a bit about your background and passion..." value={formData.shortBio} onChange={(e: any) => updateField('shortBio', e.target.value)} /></div>
                    </div>

                    <div className="border-t border-slate-200 pt-8 mt-8">
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Team Members</h4>
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
                            <AlertCircle className="size-5 text-blue-500 shrink-0" />
                            <p className="text-sm text-blue-900 font-medium">Team Size: Minimum 1 member (Founder only) Maximum 5 members (including Founder). Add team members below (You can add up to {4 - formData.teamMembers.length} more members).</p>
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
                                            <option value="Co-Founder">Co-Founder</option><option value="Developer">Developer</option><option value="Designer">Designer</option><option value="Marketing">Marketing</option><option value="Other">Other</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label required>Photo</Label>
                                        <input type="file" id={`team-upload-${idx}`} accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileUpload(e, 'team', idx)} required={!member.photo} />
                                        <label htmlFor={`team-upload-${idx}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer overflow-hidden mt-1">
                                            {member.photoPreview ? (
                                                <img src={member.photoPreview} alt="Team Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-2">
                                                    <UploadCloud className="size-5 text-blue-500 mx-auto mb-1" />
                                                    <span className="text-blue-600 font-bold text-xs block">Upload Photo</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    <div><Label>LinkedIn (Optional)</Label><Input type="url" placeholder="https://linkedin.com/in/..." value={member.linkedin} onChange={(e: any) => updateTeamMember(idx, 'linkedin', e.target.value)} /></div>
                                </div>
                            </div>
                        ))}

                        {formData.teamMembers.length < 4 && (
                            <button type="button" onClick={addTeamMember} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-600 font-bold rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                                <Plus className="size-5" /> Add Team Member
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Education */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="2" title="Educational Background" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><Label required>Institution Name</Label><Input required placeholder="e.g. Indian Institute of Technology, Madras" value={formData.institutionName} onChange={(e: any) => updateField('institutionName', e.target.value)} /></div>
                        <div>
                            <Label required>Education Level</Label>
                            <Select required value={formData.educationLevel} onChange={(e: any) => updateField('educationLevel', e.target.value)}>
                                <option value="School">School</option>
                                <option value="SSLC">SSLC</option>
                                <option value="PUC">PUC (10+2)</option>
                                <option value="College Degree">College / Degree</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* 3. Project Details */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="3" title="Project Details" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><Label required>Project / Idea Name</Label><Input required placeholder="e.g. EcoTrack AI" value={formData.projectName} onChange={(e: any) => updateField('projectName', e.target.value)} /></div>
                        <div className="md:col-span-2"><Label required>Problem Statement</Label><Textarea required rows={3} placeholder="What specific problem are you trying to solve?" value={formData.problemStatement} onChange={(e: any) => updateField('problemStatement', e.target.value)} /></div>
                        <div className="md:col-span-2"><Label required>Solution Description</Label><Textarea required rows={3} placeholder="How does your project solve this problem?" value={formData.solutionDescription} onChange={(e: any) => updateField('solutionDescription', e.target.value)} /></div>
                        <div>
                            <Label required>Current Stage</Label>
                            <Select required value={formData.currentStage} onChange={(e: any) => updateField('currentStage', e.target.value)}>
                                <option value="Ideation">Ideation (Idea phase)</option>
                                <option value="Prototype">Prototype (Working model)</option>
                                <option value="MVP">MVP (Minimum Viable Product)</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* 4. Equity */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="4" title="Investment Proposition" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label required>Funding Ask Amount (₹)</Label>
                            <Input type="number" required placeholder="e.g. 500000" min="1" value={formData.askAmount} onChange={(e: any) => updateField('askAmount', e.target.value)} />
                            <p className="text-xs text-slate-500 mt-2">How much money are you asking for to build your project?</p>
                        </div>
                        <div>
                            <Label required>Equity Offered for Incubation (%)</Label>
                            <Input type="number" required placeholder="e.g. 5" max="100" min="1" value={formData.equityOffered} onChange={(e: any) => updateField('equityOffered', e.target.value)} />
                            <p className="text-xs text-slate-500 mt-2">How much equity are you willing to offer to investors/incubators who fund or mentor your idea?</p>
                        </div>
                    </div>
                </div>

                {/* 5. Pitch Media */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="5" title="Pitch Media" />
                    <div className="space-y-4">
                        <Label>Pitch Video (YouTube Unlisted)</Label>
                        {formData.pitchVideos.map((vid, idx) => (
                            <div key={idx} className="flex gap-3">
                                <Input type="url" placeholder="https://www.youtube.com/watch?v=..." value={vid} onChange={(e: any) => {
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
                        <p className="text-xs text-slate-500">Record a short video explaining your idea and linking it here. (Optional but recommended)</p>
                        <button type="button" onClick={() => updateField('pitchVideos', [...formData.pitchVideos, ""])} className="mt-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
                            <Plus className="size-4" /> Add Another Link
                        </button>
                    </div>
                </div>

                {/* 6. Additional Notes */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                    <SectionHeader num="6" title="Additional Information" />
                    <div className="space-y-4">
                        <Label>Is there anything else we should know? (Optional)</Label>
                        <Textarea rows={4} placeholder="Any team members, patents, achievements, or specific needs?" value={formData.additionalNotes} onChange={(e: any) => updateField('additionalNotes', e.target.value)} />
                    </div>
                </div>

                {/* Final Confirmation */}
                <div className="bg-blue-50 border border-blue-200 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" required className="size-5 accent-blue-600 rounded" checked={formData.confirmed} onChange={(e) => updateField('confirmed', e.target.checked)} />
                        <div>
                            <span className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="size-5 text-blue-600"/> Honor Code</span>
                            <span className="text-sm text-slate-600 mt-1 block">I confirm that this project is my original idea and all provided information is accurate.</span>
                        </div>
                    </label>
                    <button type="submit" disabled={saving || !formData.confirmed} className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg whitespace-nowrap">
                        {saving ? <><Loader2 className="size-5 animate-spin" /> Submitting...</> : "Submit Application"}
                    </button>
                </div>
            </form>
        </div>
    );
}
