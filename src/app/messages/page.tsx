"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, FileSignature, CheckCircle2, ShieldCheck, User, FileText, ChevronRight, Video, Calendar, Clock, AlertTriangle, PlayCircle, CheckSquare, Search, Lock, Sparkles, Paperclip, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import FileAttachment from "@/components/FileAttachment";

/* ─── PII Masker ──────────────────────────────────────── */
const maskPII = (text: string, isSigned: boolean) => {
    if (isSigned) return text;
    let m = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL HIDDEN]');
    m = m.replace(/(\+?\d{1,3}[‑.\s]?)?\(?\d{3}\)?[‑.\s]?\d{3}[‑.\s]?\d{4}/g, '[PHONE HIDDEN]');
    return m;
};

/* ─── Bubble animation styles (injected once) ─────────── */
const bubbleCSS = `
@keyframes bubble-pop {
    0%   { transform: scale(0) translate(0,0); opacity:1; }
    80%  { opacity:.6; }
    100% { transform: scale(1.8) translate(var(--tx),var(--ty)); opacity:0; }
}
@keyframes ripple-ring {
    0%   { transform:scale(0); opacity:.7; }
    100% { transform:scale(2.8); opacity:0; }
}
.bubble { position:absolute; border-radius:50%; animation: bubble-pop 0.9s ease-out both; pointer-events:none; }
.ripple-ring { position:absolute; border-radius:50%; border:2px solid #10b981; animation: ripple-ring 0.8s ease-out both; pointer-events:none; }
`;

/* ─── Bubble trigger component ────────────────────────── */
function Bubbles({ trigger }: { trigger: number }) {
    const [particles, setParticles] = useState<any[]>([]);
    useEffect(() => {
        if (!trigger) return;
        const items = Array.from({ length: 18 }, (_, i) => ({
            id: i, size: Math.random() * 14 + 6,
            tx: `${(Math.random() - 0.5) * 160}px`,
            ty: `${-(Math.random() * 120 + 40)}px`,
            color: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#a7f3d0'][Math.floor(Math.random() * 5)],
            delay: Math.random() * 0.3,
        }));
        setParticles(items);
        const t = setTimeout(() => setParticles([]), 1200);
        return () => clearTimeout(t);
    }, [trigger]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            {/* Central ripple rings */}
            {trigger > 0 && (
                <>
                    <div className="ripple-ring" style={{ width: 60, height: 60, top: '50%', left: '50%', marginTop: -30, marginLeft: -30, animationDelay: '0s' }} />
                    <div className="ripple-ring" style={{ width: 60, height: 60, top: '50%', left: '50%', marginTop: -30, marginLeft: -30, animationDelay: '0.18s' }} />
                    <div className="ripple-ring" style={{ width: 60, height: 60, top: '50%', left: '50%', marginTop: -30, marginLeft: -30, animationDelay: '0.36s' }} />
                </>
            )}
            {particles.map(p => (
                <div key={p.id} className="bubble"
                    style={{
                        width: p.size, height: p.size,
                        background: p.color,
                        top: '50%', left: '50%',
                        marginTop: -p.size / 2, marginLeft: -p.size / 2,
                        '--tx': p.tx, '--ty': p.ty,
                        animationDelay: `${p.delay}s`,
                        boxShadow: `0 0 6px ${p.color}88`,
                    } as any}
                />
            ))}
        </div>
    );
}

/* ─── Main Export ─────────────────────────────────────── */
export default function DealWorkspacePage() {
    return (
        <>
            <style>{bubbleCSS}</style>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-900 bg-[#f4f6f5]">Loading Secure Workspace…</div>}>
                <DealWorkspace />
            </Suspense>
        </>
    );
}

/* ─── Deal Workspace ──────────────────────────────────── */
function DealWorkspace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const startupName = searchParams.get('name') || "HealthSync Inc.";
    const startupId = searchParams.get('startupId');
    const investorId = searchParams.get('investorId');

    const [activeTab, setActiveTab] = useState<"chat" | "trust" | "diligence" | "agreement">("chat");
    const [currentPhase, setCurrentPhase] = useState(3);
    const [bubbleTrigger, setBubbleTrigger] = useState(0);

    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [selectedMessageIds, setSelectedMessageIds] = useState<any[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const isSelectionMode = selectedMessageIds.length > 0;
    const pressTimer = useRef<NodeJS.Timeout | null>(null);

    const [meetings, setMeetings] = useState<any[]>([]);
    const [meetingDate, setMeetingDate] = useState("");
    const [meetingTime, setMeetingTime] = useState("");
    const [meetingType, setMeetingType] = useState("Intro Meeting");
    const [isScheduling, setIsScheduling] = useState(false);

    const [negotiationPhase, setNegotiationPhase] = useState<"startup_drafting" | "investor_review" | "executed">("startup_drafting");
    const [termAmount, setTermAmount] = useState("₹ 50,00,000");
    const [termEquity, setTermEquity] = useState("10.0%");
    const [companyAddress, setCompanyAddress] = useState("123 Tech Lane, BLR");
    const [paymentMethod, setPaymentMethod] = useState("wire transfer");
    const [investmentPeriod, setInvestmentPeriod] = useState("5");
    const [executives, setExecutives] = useState("Arjun CEO, Maya CTO, Raj CFO");
    const [board, setBoard] = useState("Amit Investor, Sarah Board, David Admin");
    const [investorAddress, setInvestorAddress] = useState("");
    const [startupSignature, setStartupSignature] = useState("");
    const [investorSignature, setInvestorSignature] = useState("");
    const agreementSigned = negotiationPhase === "executed";
    const [diligenceChecks, setDiligenceChecks] = useState([false, false, false]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.email || user.id);
            }
        };
        fetchUser();
    }, []);

    const fetchMessages = async () => {
        if (!startupId) return;
        try {
            const url = investorId ? `/api/deals?startupId=${startupId}&investorId=${investorId}` : `/api/deals?startupId=${startupId}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.warn(`Non-blocking warning: Deal fetch returned ${res.status}`);
                return; // Keep old messages, do not clear state
            }
            const data = await res.json();
            if (data.success && data.deal) {
                const {currentUser} = data;

                // Map DB messages to UI format with correct sides and ensure stable IDs
                const newMessages = data.deal.messages.map((m: any) => {
                    const stableId = m.id || m._id || `msg_${m.time}_${m.senderId}_${(m.text || '').substring(0, 15)}`;
                    return {
                        id: stableId,
                        sender: m.senderId === currentUser ? 'me' : 'them',
                        text: m.text,
                        time: m.time,
                        file: m.file
                    };
                });

                setMessages(prevMessages => {
                    // Smart merge to prevent flickering
                    if (prevMessages.length === 0) return newMessages;

                    // If identical length, only update if content changed
                    if (prevMessages.length === newMessages.length) {
                        const hasChanges = newMessages.some((newMsg, i) => {
                            const prevMsg = prevMessages[i];
                            return prevMsg.id !== newMsg.id || 
                                   prevMsg.text !== newMsg.text || 
                                   JSON.stringify(prevMsg.file) !== JSON.stringify(newMsg.file);
                        });
                        return hasChanges ? newMessages : prevMessages;
                    }
                    
                    // If lengths differ, we must update. But we can preserve identical objects 
                    // where possible to help React, though mapping newMessages is generally fine 
                    // as long as the `id` property is stable (which it now is).
                    return newMessages;
                });

                if (data.deal.currentPhase) {
                    setCurrentPhase(prev => data.deal.currentPhase !== prev ? data.deal.currentPhase : prev);
                }
                if (data.deal.status === 'executed') {
                    setNegotiationPhase(prev => prev !== 'executed' ? 'executed' : prev);
                }

                if (data.deal.meetings) {
                    const now = new Date();
                    const newMeetings = data.deal.meetings.map((m: any) => {
                        let meetingStatus = m.status === 'scheduled' ? 'Scheduled' : m.status;
                        const meetingDateObj = new Date(`${m.date}T${m.time}:00`);
                        if (meetingStatus === 'Scheduled' && meetingDateObj < now) {
                            meetingStatus = 'expired';
                        }
                        return {
                            id: m._id || Math.random(),
                            title: m.title,
                            date: m.date,
                            time: m.time,
                            link: m.meetLink,
                            status: meetingStatus
                        };
                    });

                    setMeetings(prevMeetings => {
                        if (prevMeetings.length !== newMeetings.length) {
                            return newMeetings;
                        }
                        const prevLast = prevMeetings[prevMeetings.length - 1];
                        const newLast = newMeetings[newMeetings.length - 1];
                        if (prevLast?.id !== newLast?.id || prevLast?.status !== newLast?.status) {
                            return newMeetings;
                        }
                        return prevMeetings;
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch deal", err);
        }
    };

    // Fetch existing deal data and poll
    useEffect(() => {
        if (!startupId) return;

        fetchMessages();

        const intervalId = setInterval(() => {
            fetchMessages();
        }, 1500);

        return () => clearInterval(intervalId);
    }, [startupId, investorId]);

    const advancePhase = async () => {
        if (currentPhase >= 5) return;
        
        if (currentPhase === 1 && messages.length === 0) {
            alert("Please send a message to initiate contact before advancing.");
            return;
        }
        if (currentPhase === 3 && meetings.length === 0) {
            alert("Please schedule at least one trust building meeting before advancing.");
            return;
        }
        if (currentPhase === 4 && diligenceChecks.some(c => !c)) {
            alert("Please complete all Due Diligence checks before proceeding to the Smart Agreement.");
            return;
        }

        const nextPhase = Math.min(5, currentPhase + 1);

        try {
            await fetch('/api/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupId,
                    investorId,
                    action: 'advancePhase',
                    newPhase: nextPhase
                })
            });
        } catch (err) {
            console.error("Failed to advance phase", err);
        }

        setBubbleTrigger(t => t + 1);
        setTimeout(() => setCurrentPhase(nextPhase), 200);
    };

    const toggleMessageSelection = (msgId: any) => {
        setSelectedMessageIds(prev =>
            prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
        );
    };

    const handleMessageRightClick = (e: React.MouseEvent, msgId: any) => {
        e.preventDefault();
        toggleMessageSelection(msgId);
    };

    const handleTouchStart = (msgId: any) => {
        pressTimer.current = setTimeout(() => {
            toggleMessageSelection(msgId);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleMessageClick = (msgId: any) => {
        if (isSelectionMode) {
            toggleMessageSelection(msgId);
        }
    };

    const handleDeleteMessages = async (mode: 'me' | 'everyone') => {
        if (!selectedMessageIds.length) return;
        setIsDeleting(true);

        const messagesToDelete = messages.filter(m => selectedMessageIds.includes(m.id));

        // Delete files from storage if 'everyone'
        if (mode === 'everyone') {
            const filesToRemove = messagesToDelete.filter(m => m.file).map(m => m.file.path);
            if (filesToRemove.length > 0) {
                const supabase = createClient();
                const { error } = await supabase.storage.from('deal-room-files').remove(filesToRemove);
                if (error) {
                    console.error("Failed to remove files from storage:", error);
                }
            }
        }

        // Optimistically update UI
        setMessages(m => m.filter(msg => !selectedMessageIds.includes(msg.id)));
        setSelectedMessageIds([]);

        // Call API
        try {
            await fetch('/api/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupId,
                    investorId,
                    action: 'deleteMessages',
                    messageIds: selectedMessageIds,
                    mode
                })
            });
        } catch (err) {
            console.error("Failed to delete messages:", err);
        } finally {
            setIsDeleting(false);
            await fetchMessages();
        }
    };

    /**
    * Handles message form submission, adds the message optimistically to the UI, and saves it to the database.
    * @example
    * sync(event)
    * void
    * @param {React.FormEvent} e - Form submission event.
    * @returns {Promise<void>} Resolves when the message has been processed and the save attempt completes.
    **/
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputMessage.trim() && !selectedFile) || !startupId || isUploading) return;

        let fileData = null;
        const messageText = inputMessage;

        if (selectedFile) {
            setIsUploading(true);
            const supabase = createClient();
            const invId = investorId || currentUserId;
            if (!invId) {
                alert("Session error. Please wait or refresh.");
                setIsUploading(false);
                return;
            }

            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${startupId}/${invId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('deal-room-files')
                .upload(filePath, selectedFile);

            if (error) {
                alert("Upload failed: " + error.message);
                setIsUploading(false);
                return;
            }

            fileData = {
                name: selectedFile.name,
                path: filePath,
                size: selectedFile.size,
                type: selectedFile.type
            };
        }

        setInputMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        const messageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(7);

        const newMsg: any = { 
            id: messageId, 
            sender: "me", 
            text: messageText, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        if (fileData) {
            newMsg.file = fileData;
        }

        // Optimistic UI update
        setMessages(m => [...m, newMsg]);

        // Save to DB
        try {
            const bodyPayload: any = {
                id: messageId,
                startupId,
                startupName,
                text: messageText,
            };
            if (fileData) {
                bodyPayload.file = fileData;
            }
            if (investorId) {
                bodyPayload.investorId = investorId;
            }

            await fetch('/api/deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });
            
            await fetchMessages();
        } catch (err) {
            console.error("Failed to save message", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate size (20MB)
            if (file.size > 20 * 1024 * 1024) {
                alert("File size exceeds 20MB limit.");
                e.target.value = "";
                return;
            }
            
            // MIME type validation for the allowed extensions
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/webp',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/zip', 'text/plain'
            ];
            
            if (!allowedTypes.includes(file.type)) {
                alert("Unsupported file type.");
                e.target.value = "";
                return;
            }

            setSelectedFile(file);
        }
    };

    const deleteMeeting = async (id: string) => {
        try {
            setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m));
            await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
            await fetchMessages();
        } catch (err) {
            console.error("Failed to cancel meeting", err);
        }
    };

    const scheduleMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meetingDate || !meetingTime || !startupId) return;

        // Check if an active meeting already exists to prevent duplicates
        const existingMeeting = meetings.find(m => m.status === 'Scheduled' || m.status === 'active');
        if (existingMeeting) {
            alert("A Trust Meeting is already scheduled. Please use the existing meeting link.");
            return;
        }

        setIsScheduling(true);

        try {
            const res = await fetch('/api/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupId,
                    investorId,
                    action: 'scheduleMeeting',
                    meeting: {
                        title: meetingType,
                        date: meetingDate,
                        time: meetingTime,
                        durationMinutes: 10,
                        status: 'scheduled'
                    }
                })
            });
            
            if (!res.ok) {
                const errData = await res.json();
                alert(errData.error || "Failed to generate meeting link.");
                setIsScheduling(false);
                return;
            }

            await fetchMessages();
            setMeetingDate("");
            setMeetingTime("");
        } catch (err) {
            console.error("Failed to schedule meeting", err);
            alert("Failed to schedule meeting. Please try again.");
        } finally {
            setIsScheduling(false);
        }
    };

    const phases = [
        { num: 1, title: "Identity & Verification", desc: "Profile & KYC Verified", icon: ShieldCheck },
        { num: 2, title: "Pitch & Initial Interest", desc: "Startup Discovery", icon: Search },
        { num: 3, title: "Secure Meetings", desc: "Trust Building", icon: Video },
        { num: 4, title: "Due Diligence", desc: "Financial Audit & AI", icon: CheckSquare },
        { num: 5, title: "Agreement & Funding", desc: "Term Sheet Executed", icon: FileSignature },
    ];

    const PHASE_COLOR = ["", "bg-emerald-500", "bg-emerald-500", "bg-indigo-600", "bg-amber-500", "bg-pink-500"];

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[#f4f6f5]">
            {/* ── TOP BAR ── */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
                <div>
                    <h1 className="text-xl font-bold font-outfit flex items-center gap-2">
                        <Lock className="size-5 text-emerald-400" />
                        Secure Deal Workspace
                        <span className="text-sm font-medium px-3 py-0.5 bg-white/10 rounded-full text-slate-300 border border-white/10">with {startupName}</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">End-to-end encrypted negotiation · 5-phase investment lifecycle</p>
                </div>
                <div className="relative">
                    <Bubbles trigger={bubbleTrigger} />
                    {currentPhase < 5 && (
                        <button
                            onClick={advancePhase}
                            className="relative flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md hover:shadow-emerald-600/30 hover:scale-105 active:scale-95"
                        >
                            <Sparkles className="size-4" />
                            Advance to Phase {currentPhase + 1}
                            <ChevronRight className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-0 overflow-hidden">
                {/* ── SIDEBAR ── */}
                <aside className="lg:w-64 bg-slate-900 text-white px-5 py-6 flex flex-col gap-2 border-r border-slate-700 shrink-0">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">Deal Lifecycle</p>

                    {/* Vertical connecting line container */}
                    <div className="relative flex flex-col gap-0">
                        <div className="absolute left-5 inset-y-6 w-0.5 bg-slate-700 z-0" />

                        {phases.map((phase) => {
                            const isPast = phase.num < currentPhase;
                            const isCurrent = phase.num === currentPhase;
                            const isLocked = phase.num > currentPhase;
                            const Icon = phase.icon;

                            return (
                                <div key={phase.num} className={`relative z-10 flex gap-3 items-start py-3 px-2 rounded-xl transition-all ${isCurrent ? 'bg-white/8 ' : ''} ${isLocked ? 'opacity-35' : ''}`}>
                                    {/* Phase bubble */}
                                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isPast ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                                        isCurrent ? `${PHASE_COLOR[phase.num]} shadow-[0_0_16px_rgba(99,102,241,0.5)] ring-2 ring-white/30` :
                                            'bg-slate-700 border border-slate-600'
                                        }`}>
                                        {isPast ? <CheckCircle2 className="size-5 text-white" /> : <Icon className="size-4 text-white" />}
                                    </div>

                                    <div className="pt-0.5">
                                        <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Phase {phase.num}</p>
                                        <p className={`text-sm font-semibold leading-tight ${isCurrent ? 'text-white' : isPast ? 'text-emerald-400' : 'text-slate-400'}`}>{phase.title}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{phase.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Tab bar */}
                    <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-0 flex gap-1 overflow-x-auto shrink-0">
                        {[
                            { key: 'chat', label: 'Message Room', phase: 1, color: 'emerald' },
                            { key: 'trust', label: 'Trust Building', phase: 3, color: 'indigo' },
                            { key: 'diligence', label: 'Due Diligence', phase: 4, color: 'amber' },
                            { key: 'agreement', label: 'Smart Agreement', phase: 5, color: 'pink' },
                        ].map(t => {
                            const locked = currentPhase < t.phase;
                            const isActive = activeTab === t.key;
                            return (
                                <button key={t.key}
                                    onClick={() => !locked && setActiveTab(t.key as any)}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                                        ${isActive ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60' : 'border-transparent text-slate-500 hover:text-slate-700'}
                                        ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {t.label}
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                        ${t.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                            t.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                                                t.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-pink-100 text-pink-700'}`}>
                                        P{t.phase}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content area */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-white">

                        {/* ── CHAT ── */}
                        {activeTab === 'chat' && (
                            <>
                                {/* Chat header or Action Bar */}
                                {isSelectionMode ? (
                                    <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50 flex items-center justify-between shrink-0 transition-all">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setSelectedMessageIds([])} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-700 transition-colors">
                                                <ArrowLeft className="size-5" />
                                            </button>
                                            <p className="font-semibold text-emerald-800 text-sm">{selectedMessageIds.length} selected</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleDeleteMessages('me')}
                                                disabled={isDeleting}
                                                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm transition-all"
                                            >
                                                Delete for Me
                                            </button>
                                            {/* Only allow Delete for Everyone if current user sent all selected messages */}
                                            {selectedMessageIds.length > 0 && messages.filter(m => selectedMessageIds.includes(m.id)).every(m => m.sender === 'me') && (
                                                <button 
                                                    onClick={() => {
                                                        if (confirm("Delete these messages for everyone? This cannot be undone.")) {
                                                            handleDeleteMessages('everyone');
                                                        }
                                                    }}
                                                    disabled={isDeleting}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg shadow-sm transition-all"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Delete for Everyone
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
                                        <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <User className="text-indigo-600 size-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{startupName}</p>
                                            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Encrypted P2P Connection
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Messages */}
                                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-xs text-center max-w-md mx-auto">
                                        PII (phones, emails) are masked until Phase 5 (Agreement Execution).
                                    </div>
                                    {messages.map(msg => {
                                        const isSelected = selectedMessageIds.includes(msg.id);
                                        return (
                                            <div 
                                                key={msg.id} 
                                                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} cursor-pointer`}
                                                onClick={() => handleMessageClick(msg.id)}
                                                onContextMenu={(e) => handleMessageRightClick(e, msg.id)}
                                                onTouchStart={() => handleTouchStart(msg.id)}
                                                onTouchEnd={handleTouchEnd}
                                            >
                                                <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm transition-all
                                                    ${isSelected ? 'ring-2 ring-emerald-400 opacity-90 scale-[0.98]' : ''}
                                                    ${msg.sender === 'me'
                                                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                                                        : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200'}`}>
                                                    
                                                    {msg.file && <FileAttachment file={msg.file} />}
                                                    
                                                    {msg.text && <p className={msg.file ? "mt-2" : ""}>{maskPII(msg.text, agreementSigned)}</p>}
                                                    
                                                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-emerald-100' : 'text-slate-400'}`}>{msg.time}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {messages.length === 0 && (
                                        <div className="text-center py-16 opacity-40">
                                            <Lock className="size-10 mx-auto mb-2 text-slate-400" />
                                            <p className="text-sm text-slate-400">Secure channel open – send your first message</p>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0 items-end">
                                    <div className="flex flex-col grow gap-2">
                                        {selectedFile && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs flex justify-between items-center w-max max-w-full">
                                                <span className="truncate mr-4 text-emerald-800">{selectedFile.name}</span>
                                                <button type="button" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="text-emerald-600 hover:text-red-500 shrink-0 font-bold">X</button>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="size-11 shrink-0 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 transition-all"
                                                title="Attach a file"
                                                disabled={isUploading}
                                            >
                                                <Paperclip className="size-5" />
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileSelect} 
                                                className="hidden" 
                                                accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,text/plain"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Type your secure message..."
                                                className="grow bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all disabled:opacity-50"
                                                value={inputMessage}
                                                onChange={e => setInputMessage(e.target.value)}
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={(!inputMessage.trim() && !selectedFile) || isUploading}
                                        className="size-11 shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-all">
                                        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ── TRUST BUILDING ── */}
                        {activeTab === 'trust' && currentPhase >= 3 && (
                            <div className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto">
                                <div className="md:w-1/2 space-y-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Video className="text-indigo-600 size-5" /> Trust Building Meetings</h2>
                                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">Short, structured 10-minute Google Meet sessions for mutual alignment.</p>
                                    </div>
                                    <form onSubmit={scheduleMeeting} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                                        <h3 className="text-sm font-semibold text-slate-700">Propose a 10-Min Session</h3>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Session Type</label>
                                            <select className="w-full mt-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                                value={meetingType} onChange={e => setMeetingType(e.target.value)}>
                                                <option>Intro Meeting</option>
                                                <option>Deep-Dive Discussion</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date</label>
                                                <input type="date" className="w-full mt-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                                    value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Time</label>
                                                <input type="time" className="w-full mt-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                                    value={meetingTime} onChange={e => setMeetingTime(e.target.value)} required />
                                            </div>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex gap-2">
                                            <Clock className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-indigo-700 leading-snug">A secure Video Session link will be auto-generated. Both parties must honor the 10-minute hard stop.</p>
                                        </div>
                                        <button type="submit" disabled={isScheduling} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isScheduling ? "Generating Secure Meeting..." : "Schedule Session"}
                                        </button>
                                    </form>
                                </div>
                                <div className="md:w-1/2 space-y-3">
                                    <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-3">Scheduled Sessions</h3>
                                    {meetings.length === 0 || meetings.filter(m => m.status !== 'cancelled').length === 0 ? (
                                        <div className="py-12 text-center border border-dashed border-slate-300 rounded-2xl">
                                            <Calendar className="size-10 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No active trust sessions scheduled.</p>
                                        </div>
                                    ) : meetings.filter(m => m.status !== 'cancelled').map(m => (
                                        <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center gap-4 hover:border-indigo-300 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`size-2 rounded-full ${m.status === 'Scheduled' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                    <h4 className="text-sm font-bold text-slate-800">{m.title}</h4>
                                                    <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full capitalize">{m.status}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{m.date} at {m.time}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {m.status === 'Scheduled' && (
                                                    <button onClick={() => deleteMeeting(m.id)} className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap">
                                                        Cancel
                                                    </button>
                                                )}
                                                <button onClick={() => {
                                                    if (!m.link) { alert("Invalid Meeting URL."); return; }
                                                    window.open(m.link, '_blank');
                                                }} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap">
                                                    <PlayCircle className="size-3.5" /> Join Meet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'trust' && currentPhase < 3 && <PhaseLock phase={3} />}

                        {/* ── DUE DILIGENCE ── */}
                        {activeTab === 'diligence' && currentPhase >= 4 && (
                            <div className="p-6 overflow-y-auto">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5"><CheckSquare className="text-amber-600 size-5" /> Due Diligence Portal</h2>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">Financial Audit Check</h3>
                                        {['Revenue Statements Authenticated', 'Burn Rate Anomalies Cleared', 'Cap Table Verified'].map((l, i) => (
                                            <label key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-lg cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all mb-2">
                                                <input type="checkbox" className="size-4 rounded text-emerald-600" 
                                                    checked={diligenceChecks[i]}
                                                    onChange={e => {
                                                        const newChecks = [...diligenceChecks];
                                                        newChecks[i] = e.target.checked;
                                                        setDiligenceChecks(newChecks);
                                                    }}
                                                />
                                                <span className="text-sm text-slate-700">{l}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 size-24 bg-amber-100 rounded-bl-full" />
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-amber-200">AI Credibility Report</h3>
                                        <div className="flex items-center justify-center p-4">
                                            <div className="text-center">
                                                <span className="text-5xl font-bold text-amber-600 font-mono">A+</span>
                                                <p className="text-sm text-slate-600 mt-2 font-medium">InVolution Risk AI passed</p>
                                                <p className="text-xs text-slate-400 mt-1">Cross-referenced with 50+ data registries.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'diligence' && currentPhase < 4 && <PhaseLock phase={4} />}

                        {/* ── AGREEMENT ── */}
                        {activeTab === 'agreement' && currentPhase >= 5 && (
                            <div className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto bg-slate-50">
                                <div className="md:w-1/2 space-y-4">
                                    <div className="flex items-center gap-2 text-pink-600 mb-1">
                                        <ShieldCheck className="size-5" />
                                        <h2 className="text-lg font-bold">Smart Agreement</h2>
                                    </div>
                                    <p className="text-xs text-slate-500 border-b border-slate-200 pb-4">These terms will be deployed to an on-chain legally binding digital contract.</p>
                                    <div className="space-y-3">
                                        {negotiationPhase === 'startup_drafting' ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(
                                                        [
                                                            ['Invest Amount', termAmount, setTermAmount],
                                                            ['Equity Exch.', termEquity, setTermEquity],
                                                        ] as [string, string, (v: string) => void][]
                                                    ).map(([label, val, fn]) => (
                                                        <div key={label}>
                                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</label>
                                                            <input type="text" value={val} onChange={e => fn(e.target.value)}
                                                                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:ring-2 focus:ring-pink-400 outline-none" />
                                                        </div>
                                                    ))}
                                                </div>
                                                {(
                                                    [
                                                        ['Payment Method', paymentMethod, setPaymentMethod],
                                                        ['Company Address', companyAddress, setCompanyAddress],
                                                    ] as [string, string, (v: string) => void][]
                                                ).map(([label, val, fn]) => (
                                                    <div key={label}>
                                                        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</label>
                                                        <input type="text" value={val} onChange={e => fn(e.target.value)}
                                                            className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:ring-2 focus:ring-pink-400 outline-none" />
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                                <p className="text-xs text-slate-400 mb-1 uppercase tracking-widest">Final Terms</p>
                                                <p className="text-pink-600 font-bold">{termAmount} for {termEquity}</p>
                                                <p className="text-slate-400 text-xs mt-1">Via {paymentMethod}, locked for {investmentPeriod} years.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:w-1/2 flex flex-col justify-center gap-5">
                                    {negotiationPhase === 'executed' ? (
                                        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center">
                                            <CheckCircle2 className="size-14 text-emerald-500 mx-auto mb-3" />
                                            <h3 className="text-emerald-700 font-bold text-xl mb-2">Deal Executed!</h3>
                                            <p className="text-sm text-emerald-600/70 mb-6 border-b border-emerald-200 pb-4">Countersigned by both parties. Investment round is finalized.</p>
                                            <button
                                                onClick={() => router.push(`/messages/agreement?startup=${encodeURIComponent(startupName)}&amount=${encodeURIComponent(termAmount)}&equity=${encodeURIComponent(termEquity)}&signature=${encodeURIComponent(investorSignature)}&startupSig=${encodeURIComponent(startupSignature)}&cAddress=${encodeURIComponent(companyAddress)}&iAddress=${encodeURIComponent(investorAddress)}&payment=${encodeURIComponent(paymentMethod)}&period=${encodeURIComponent(investmentPeriod)}&execs=${encodeURIComponent(executives)}&board=${encodeURIComponent(board)}`)}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                                <FileText className="size-4" /> View Official Term Sheet
                                            </button>
                                        </div>
                                    ) : negotiationPhase === 'startup_drafting' ? (
                                        <div className="space-y-4">
                                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                                                <p className="text-sm text-indigo-700 font-medium">Step 1/2: Startup proposes final binding terms.</p>
                                            </div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Startup Founder Signature</label>
                                            <input type="text" placeholder="Type full legal name…"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none font-serif italic"
                                                value={startupSignature} onChange={e => setStartupSignature(e.target.value)} />
                                            <button onClick={() => startupSignature.length > 3 && setNegotiationPhase('investor_review')}
                                                disabled={startupSignature.length <= 3}
                                                className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-40 transition-all">
                                                Sign & Lock Terms
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-pink-50 border border-pink-200 p-4 rounded-xl">
                                                <p className="text-sm text-pink-700 font-medium">Step 2/2: Investor Review. Terms are locked by the Startup.</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Your Investor Address</label>
                                                <input type="text" value={investorAddress} onChange={e => setInvestorAddress(e.target.value)}
                                                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:ring-2 focus:ring-pink-400 outline-none" placeholder="Registered address…" />
                                            </div>
                                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Investor Counter-Signature</label>
                                            <input type="text" placeholder="Type full legal name…"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-pink-400 outline-none font-serif italic"
                                                value={investorSignature} onChange={e => setInvestorSignature(e.target.value)} />
                                            <button onClick={async () => {
                                                if (investorSignature.length > 3) {
                                                    try {
                                                        await fetch('/api/deals', {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                startupId,
                                                                investorId,
                                                                action: 'execute',
                                                                termAmount,
                                                                termEquity,
                                                                startupSignature,
                                                                investorSignature,
                                                                companyAddress,
                                                                investorAddress,
                                                                paymentMethod,
                                                                investmentPeriod,
                                                                executives,
                                                                board
                                                            })
                                                        });
                                                    } catch (err) {
                                                        console.error("Failed to execute deal", err);
                                                    }
                                                    setNegotiationPhase('executed');
                                                    router.push(`/messages/agreement?success=true&startup=${encodeURIComponent(startupName)}&amount=${encodeURIComponent(termAmount)}&equity=${encodeURIComponent(termEquity)}&signature=${encodeURIComponent(investorSignature)}&startupSig=${encodeURIComponent(startupSignature)}&cAddress=${encodeURIComponent(companyAddress)}&iAddress=${encodeURIComponent(investorAddress)}&payment=${encodeURIComponent(paymentMethod)}&period=${encodeURIComponent(investmentPeriod)}&execs=${encodeURIComponent(executives)}&board=${encodeURIComponent(board)}`);
                                                }
                                            }}
                                                disabled={investorSignature.length <= 3}
                                                className="w-full py-3 mt-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl disabled:opacity-40 transition-all">
                                                Counter-Sign & Execute Deal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'agreement' && currentPhase < 5 && <PhaseLock phase={5} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Phase Lock Placeholder ──────────────────────────── */
function PhaseLock({ phase }: { phase: number }) {
    return (
        <div className="flex-1 flex items-center justify-center p-8 text-center bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xs shadow-sm">
                <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Lock className="size-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">Phase {phase} Locked</h3>
                <p className="text-sm text-slate-400">Advance the deal lifecycle to Phase {phase} to unlock this section.</p>
            </div>
        </div>
    );
}
