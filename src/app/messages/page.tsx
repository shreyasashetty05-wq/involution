"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, FileSignature, CheckCircle2, ShieldCheck, User, FileText, ChevronRight, Video, Calendar, Clock, AlertTriangle, PlayCircle, CheckSquare, Search, Lock, Sparkles, Paperclip, Loader2, ArrowLeft, Trash2, MoreVertical, Smile, Check, CheckCheck, Reply, Copy, Edit2, X, ChevronDown, Ban, Handshake } from "lucide-react";
import { NegotiationTab } from "@/frontend/components/negotiation/NegotiationTab";
import { createClient } from "@/utils/supabase/client";
import FileAttachment from "@/components/FileAttachment";
import { useToast } from "@/components/ui/ToastProvider";
import InvestorProfileModal from "@/components/InvestorProfileModal";

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

    const [activeTab, setActiveTab] = useState<"chat" | "trust" | "diligence" | "negotiation" | "agreement">("chat");
    const [currentPhase, setCurrentPhase] = useState(3);
    const [dealId, setDealId] = useState<string | null>(null);
    const [bubbleTrigger, setBubbleTrigger] = useState(0);
    const [showInvestorModal, setShowInvestorModal] = useState(false);
    const [investorProfile, setInvestorProfile] = useState<any>(null);
    const toast = useToast();

    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [selectedMessageIds, setSelectedMessageIds] = useState<any[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isSelectionMode = selectedMessageIds.length > 0;
    const pressTimer = useRef<NodeJS.Timeout | null>(null);

    // Context Menu & WhatsApp States
    const [hoverMessageId, setHoverMessageId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ msgId: string, x: number, y: number } | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const COMMON_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '🎉', '😊', '🙌', '💯', '👏'];

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
    }, [messages, typingUser]);

    // Removed window.addEventListener('click') for context menu to prevent race conditions

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showDeleteConfirm && !isDeleting) {
                setShowDeleteConfirm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showDeleteConfirm, isDeleting]);

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

    useEffect(() => {
        const fetchInvestorProfile = async () => {
            if (!investorId) return;
            try {
                const res = await fetch(`/api/investors/public/${investorId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) setInvestorProfile(data.profile);
                }
            } catch (err) {
                console.error("Failed to fetch investor profile:", err);
            }
        };
        fetchInvestorProfile();
    }, [investorId]);

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
                setDealId(data.deal.id);
                const {currentUser} = data;

                // Map DB messages to UI format with correct sides and ensure stable IDs
                const newMessages = data.deal.messages.map((m: any) => {
                    const stableId = m.id || m._id || `msg_${m.time}_${m.senderId}_${(m.text || '').substring(0, 15)}`;
                    return {
                        id: stableId,
                        sender: m.senderId === currentUser ? 'me' : 'them',
                        text: m.text,
                        time: m.time,
                        file: m.file,
                        replyTo: m.replyTo,
                        isDeletedForEveryone: m.isDeletedForEveryone,
                        createdAt: m.createdAt
                    };
                });

                setMessages(prevMessages => {
                    const pendingMessages = prevMessages.filter(m => m.isPending);
                    const newPending = pendingMessages.filter(pm => !newMessages.some((nm: any) => nm.id === pm.id));
                    
                    const merged = [...newMessages, ...newPending];

                    // If identical length, only update if content changed
                    if (prevMessages.length === merged.length) {
                        const hasChanges = merged.some((msg, i) => {
                            const prevMsg = prevMessages[i];
                            return prevMsg.id !== msg.id || 
                                   prevMsg.text !== msg.text || 
                                   JSON.stringify(prevMsg.file) !== JSON.stringify(msg.file) ||
                                   prevMsg.replyTo !== msg.replyTo ||
                                   prevMsg.isDeletedForEveryone !== msg.isDeletedForEveryone;
                        });
                        return hasChanges ? merged : prevMessages;
                    }
                    
                    return merged;
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
            toast.warning("Please send a message to initiate contact before advancing.");
            return;
        }
        if (currentPhase === 3 && meetings.length === 0) {
            toast.warning("Please schedule at least one trust building meeting before advancing.");
            return;
        }
        if (currentPhase === 4 && diligenceChecks.some(c => !c)) {
            toast.warning("Please complete all Due Diligence checks before proceeding to the Smart Agreement.");
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

        setBubbleTrigger((t: number) => t + 1);
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
        toggleMessageSelection(msgId);
    };

    const handleDeleteMessages = async (mode: 'me' | 'everyone') => {
        if (!selectedMessageIds.length) return;
        setIsDeleting(true);

        const messagesToDelete = messages.filter(m => selectedMessageIds.includes(m.id));
        const idsToDelete = [...selectedMessageIds];

        // 1. Optimistically update UI FIRST so FileAttachment unmounts immediately
        // and doesn't try to fetch a signed URL for a file that is being deleted.
        setMessages(m => m.filter(msg => !idsToDelete.includes(msg.id)));
        setSelectedMessageIds([]);

        let storageError = false;

        // 2. Delete files from storage if 'everyone'
        if (mode === 'everyone') {
            const filesToRemove = messagesToDelete.filter(m => m.file).map(m => m.file.path);
            if (filesToRemove.length > 0) {
                const supabase = createClient();
                const { error } = await supabase.storage.from('deal-room-files').remove(filesToRemove);
                if (error) {
                    console.error("Failed to remove files from storage:", error);
                    storageError = true;
                }
            }
        }

        // 3. Call API to delete messages
        try {
            if (storageError) throw new Error("Storage deletion failed");
            
            const res = await fetch('/api/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupId,
                    investorId,
                    action: 'deleteMessages',
                    messageIds: idsToDelete,
                    mode
                })
            });
            
            if (!res.ok) throw new Error("API deletion failed");
            setShowDeleteConfirm(false);
        } catch (err) {
            console.error("Failed to delete messages:", err);
            // 5. Restore messages on failure
            setMessages(m => {
                const restored = [...m, ...messagesToDelete];
                return restored; 
            });
            toast.warning("Failed to delete messages. They have been restored.");
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
            await fetchMessages(); // Fetch true state from server
        }
    };

    const handleDeleteSingleMessage = async (msgId: string, mode: 'me' | 'everyone') => {
        setContextMenu(null);
        if (!startupId) return;
        const previousMessages = [...messages];
        // Optimistically remove from UI
        setMessages(m => m.filter(msg => msg.id !== msgId));
        try {
            const res = await fetch('/api/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deleteMessages',
                    startupId,
                    investorId: investorId, // only if acting as startup
                    messageIds: [msgId],
                    mode
                }),
            });
            const data = await res.json();
            if (data.success && data.deal) {
                toast.success(mode === 'me' ? "Message deleted for you" : "Message deleted for everyone");
            } else {
                setMessages(previousMessages);
                toast.error("Failed to delete message");
            }
        } catch (error) {
            setMessages(previousMessages);
            toast.error("Error deleting message");
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputMessage.trim() && !selectedFile) || !startupId || isUploading) return;

        let optimisticFileData = null;
        let fileExt = null;
        let fileName = null;
        let filePath = null;

        const messageText = inputMessage;
        const messageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(7);

        if (selectedFile) {
            setIsUploading(true);
            const invId = investorId || currentUserId;
            if (!invId) {
                toast.warning("Session error. Please wait or refresh.");
                setIsUploading(false);
                return;
            }

            fileExt = selectedFile.name.split('.').pop();
            fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            filePath = `${startupId}/${invId}/${fileName}`;

            optimisticFileData = {
                name: selectedFile.name,
                path: filePath,
                size: selectedFile.size,
                type: selectedFile.type,
                previewUrl: URL.createObjectURL(selectedFile),
                isUploading: true
            };
        }

        setInputMessage("");
        const fileToUpload = selectedFile;
        setSelectedFile(null);
        const currentReplyingTo = replyingTo;
        setReplyingTo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        const newMsg: any = { 
            id: messageId, 
            sender: "me", 
            text: messageText, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isPending: true,
            replyTo: currentReplyingTo ? currentReplyingTo.id : undefined
        };
        if (optimisticFileData) {
            newMsg.file = optimisticFileData;
        }

        // Optimistic UI update
        setMessages(m => [...m, newMsg]);

        // Fake typing indicator for 3 seconds
        setTimeout(() => {
            setTypingUser(startupName);
            setTimeout(() => setTypingUser(null), 3000);
        }, 1000);

        let finalFileData: any = null;
        if (fileToUpload && filePath) {
            const supabase = createClient();
            const { data, error } = await supabase.storage
                .from('deal-room-files')
                .upload(filePath, fileToUpload);

            if (error) {
                toast.warning("Upload failed: " + error.message);
                setMessages(m => m.filter(msg => msg.id !== messageId));
                setIsUploading(false);
                return;
            }

            finalFileData = {
                name: fileToUpload.name,
                path: filePath,
                size: fileToUpload.size,
                type: fileToUpload.type
            };
            
            setMessages(m => m.map(msg => msg.id === messageId ? { ...msg, file: finalFileData } : msg));
            setIsUploading(false);
        }

        // Save to DB
        try {
            const bodyPayload: any = {
                id: messageId,
                startupId,
                startupName,
                text: messageText,
            };
            if (finalFileData) {
                bodyPayload.file = finalFileData;
            }
            if (investorId) {
                bodyPayload.investorId = investorId;
            }
            if (currentReplyingTo) {
                bodyPayload.replyTo = currentReplyingTo.id;
            }

            await fetch('/api/deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });
            
        } catch (err) {
            console.error("Failed to save message", err);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate size (20MB)
            if (file.size > 20 * 1024 * 1024) {
                toast.warning("File size exceeds 20MB limit.");
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
                toast.warning("Unsupported file type.");
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
            toast.warning("A Trust Meeting is already scheduled. Please use the existing meeting link.");
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
                toast.warning(errData.error || "Failed to generate meeting link.");
                setIsScheduling(false);
                return;
            }

            await fetchMessages();
            setMeetingDate("");
            setMeetingTime("");
        } catch (err) {
            console.error("Failed to schedule meeting", err);
            toast.warning("Failed to schedule meeting. Please try again.");
        } finally {
            setIsScheduling(false);
        }
    };

    const phases = [
        { num: 1, title: "Identity & Verification", desc: "Profile & KYC Verified", icon: ShieldCheck },
        { num: 2, title: "Pitch & Initial Interest", desc: "Startup Discovery", icon: Search },
        { num: 3, title: "Meetings", desc: "Trust Building", icon: Video },
        { num: 4, title: "Negotiation", desc: "Deal Terms & Discussion", icon: Handshake },
        { num: 5, title: "Agreement & Funding", desc: "Term Sheet Executed", icon: FileSignature },
    ];

    const PHASE_COLOR = ["", "bg-emerald-500", "bg-emerald-500", "bg-indigo-600", "bg-amber-500", "bg-pink-500"];

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f4f6f5] overflow-hidden">
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
                            { key: 'trust', label: 'Meetings', phase: 2, color: 'indigo' },
                            { key: 'diligence', label: 'Due Diligence', phase: 3, color: 'amber' },
                            { key: 'negotiation', label: 'Negotiation', phase: 4, color: 'blue' },
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
                                            {selectedMessageIds.length === 1 && (
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            const msg = messages.find(m => m.id === selectedMessageIds[0]);
                                                            if (msg && !msg.isDeletedForEveryone) {
                                                                setReplyingTo(msg);
                                                                setSelectedMessageIds([]);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                                    >
                                                        <Reply className="size-3.5" />
                                                        Reply
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const msg = messages.find(m => m.id === selectedMessageIds[0]);
                                                            if (msg && msg.text && !msg.isDeletedForEveryone) {
                                                                navigator.clipboard.writeText(msg.text);
                                                                toast.success("Copied to clipboard");
                                                                setSelectedMessageIds([]);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                                    >
                                                        <Copy className="size-3.5" />
                                                        Copy
                                                    </button>
                                                </>
                                            )}
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
                                                    onClick={() => setShowDeleteConfirm(true)}
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
                                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-200/50 p-1.5 -ml-1.5 rounded-lg transition-colors" onClick={() => setShowInvestorModal(true)}>
                                            <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                                                {investorProfile ? (
                                                    <img src={investorProfile.photo_url || `https://ui-avatars.com/api/?name=${investorProfile.full_name}`} alt={investorProfile.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="text-indigo-600 size-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-[15px] leading-tight">{startupName}</p>
                                                <p className="text-[12px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Encrypted P2P
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors" title="Options">
                                                <MoreVertical className="size-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto py-5 bg-chat-pattern relative" onScroll={() => setContextMenu(null)}>
                                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-xs text-center max-w-md mx-auto mb-4 shadow-sm z-10 relative">
                                        PII (phones, emails) are masked until Phase 5 (Agreement Execution).
                                    </div>
                                    
                                    {messages.length > 0 && (
                                        <div className="flex justify-center mb-6 sticky top-2 z-10 pointer-events-none">
                                            <span className="date-pill bg-[#f1f2f6]/90 backdrop-blur-sm shadow-sm pointer-events-auto">Today</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col px-2 md:px-5 pb-2">
                                        {messages.map(msg => {
                                            const isSelected = selectedMessageIds.includes(msg.id) || contextMenu?.msgId === msg.id || replyingTo?.id === msg.id;
                                            const isMe = msg.sender === 'me';
                                            const isHovered = hoverMessageId === msg.id;

                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} mb-1 relative group transition-colors duration-200 -mx-2 md:-mx-5 px-2 md:px-5 py-1
                                                    ${isSelected ? 'bg-emerald-500/15' : ''}`}
                                                    onMouseEnter={() => setHoverMessageId(msg.id)}
                                                    onMouseLeave={() => setHoverMessageId(null)}
                                                >
                                                    {/* Context Menu Dropdown */}
                                                    {contextMenu?.msgId === msg.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
                                                            <div 
                                                                className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 min-w-[160px] animate-in zoom-in-95 duration-100"
                                                                style={{ 
                                                                    top: `${Math.min(contextMenu?.y ?? 0, (typeof window !== 'undefined' ? window.innerHeight : 800) - 250)}px`, 
                                                                    left: `${Math.min(contextMenu?.x ?? 0, (typeof window !== 'undefined' ? window.innerWidth : 800) - 180)}px`
                                                                }}
                                                            >
                                                            <div className="flex justify-between px-3 py-2 border-b border-slate-50 mb-1">
                                                                {['👍', '❤️', '🚀', '🎉', '😂'].map(emoji => (
                                                                    <button key={emoji} className="hover:scale-125 transition-transform text-lg" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}>{emoji}</button>
                                                                ))}
                                                            </div>
                                                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setContextMenu(null); }}><Reply className="size-4" /> Reply</button>
                                                            <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.text); setContextMenu(null); toast.success("Copied to clipboard"); }}><Copy className="size-4" /> Copy</button>
                                                            {isMe && <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}><Edit2 className="size-4" /> Edit</button>}
                                                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleDeleteSingleMessage(msg.id, 'me'); }}><Trash2 className="size-4" /> Delete for me</button>
                                                            {isMe && <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleDeleteSingleMessage(msg.id, 'everyone'); }}><Trash2 className="size-4" /> Delete for everyone</button>}
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                                                        {!isMe && (
                                                            <div className="shrink-0 cursor-pointer mb-1" onClick={() => setShowInvestorModal(true)}>
                                                                {investorProfile ? (
                                                                    <img src={investorProfile.photo_url || `https://ui-avatars.com/api/?name=${investorProfile.full_name}`} alt={investorProfile.full_name} className="w-7 h-7 rounded-full object-cover shadow-sm ring-1 ring-white/50" />
                                                                ) : (
                                                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm"><User className="size-3.5" /></div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div 
                                                            id={'msg-' + msg.id}
                                                            className={`relative px-3 py-2 text-[15px] leading-relaxed animate-in fade-in slide-in-from-bottom-2 transition-all duration-300
                                                            ${isMe ? 'chat-bubble-sent text-[#111b21]' : 'chat-bubble-received text-[#111b21]'}`}
                                                            onClick={() => handleMessageClick(msg.id)}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
                                                            }}
                                                            onTouchStart={() => handleTouchStart(msg.id)}
                                                            onTouchEnd={handleTouchEnd}
                                                        >
                                                            {/* Desktop Hover Chevron */}
                                                            {!msg.isDeletedForEveryone && (
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setContextMenu({ msgId: msg.id, x: rect.left - 160, y: rect.bottom }); 
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-gradient-to-l from-white/90 to-transparent p-1 rounded-full text-slate-500 hover:text-slate-700 hidden group-hover:block"
                                                                >
                                                                    <ChevronDown className="size-4" />
                                                                </button>
                                                            )}

                                                            {!isMe && investorProfile && (
                                                                <div className="text-[13px] font-semibold text-emerald-600 mb-1 cursor-pointer hover:underline flex items-center gap-1 leading-none" onClick={(e) => { e.stopPropagation(); setShowInvestorModal(true); }}>
                                                                    {investorProfile.full_name}
                                                                </div>
                                                            )}

                                                            {msg.isDeletedForEveryone ? (
                                                                <div className="flex items-center gap-1.5 text-slate-500 italic text-[14px]">
                                                                    <Ban className="size-3.5" />
                                                                    {isMe ? "You deleted this message" : "This message was deleted"}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {msg.replyTo && (() => {
                                                                        const repliedMsg = messages.find(m => m.id === msg.replyTo);
                                                                        if (!repliedMsg) return null;
                                                                        return (
                                                                            <div className="bg-black/5 border-l-4 border-emerald-500 rounded p-1.5 mb-1.5 text-xs flex flex-col cursor-pointer hover:bg-black/10 transition-colors"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const el = document.getElementById('msg-' + msg.replyTo);
                                                                                    if (el) {
                                                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                        el.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-100');
                                                                                        setTimeout(() => {
                                                                                            el.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-100');
                                                                                        }, 1500);
                                                                                    }
                                                                                }}>
                                                                                <span className="font-semibold text-emerald-600 mb-0.5">{repliedMsg.sender === 'me' ? 'You' : investorProfile?.full_name || 'Them'}</span>
                                                                                <span className="text-slate-600 truncate max-w-[200px]">
                                                                                    {repliedMsg.isDeletedForEveryone ? "This message was deleted" : (repliedMsg.text || 'Attachment')}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {msg.file && <FileAttachment file={msg.file} />}
                                                                    
                                                                    {msg.text && (
                                                                        <div className={`break-words ${msg.file ? "mt-1.5" : ""}`}>
                                                                            {maskPII(msg.text, agreementSigned)}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            
                                                            {/* Timestamp & Ticks aligned to bottom right corner WhatsApp style */}
                                                            <div className={`flex items-center justify-end gap-1 text-[10.5px] mt-1 -mb-1 float-right clear-both ml-4 text-[#667781]`}>
                                                                {msg.time}
                                                                {isMe && !msg.isDeletedForEveryone && (
                                                                    <span className="ml-0.5">
                                                                        {msg.isPending ? (
                                                                            <Check className="size-3.5 text-slate-400" />
                                                                        ) : (
                                                                            <CheckCheck className="size-3.5 text-blue-500" />
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Hover Action Trigger Desktop */}
                                                        {isHovered && !contextMenu && (
                                                            <button 
                                                                className="hidden md:flex p-1.5 bg-white/80 hover:bg-white text-slate-500 rounded-full shadow-sm backdrop-blur-sm transition-all"
                                                                onClick={(e) => { e.stopPropagation(); setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY }); }}
                                                            >
                                                                <ChevronRight className="size-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Typing Indicator */}
                                        {typingUser && (
                                            <div className="flex gap-2 items-end mb-3 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0 mb-1 animate-pulse" />
                                                <div className="chat-bubble-received px-4 py-3 text-slate-500 flex gap-1 items-center shadow-sm">
                                                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}

                                        {messages.length === 0 && !typingUser && (
                                            <div className="text-center py-20 px-6 max-w-sm mx-auto animate-in fade-in duration-500">
                                                <div className="size-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                    <Lock className="size-7 text-emerald-500" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm border border-slate-100">
                                                    Start your first conversation professionally. Introduce yourself and begin discussing the investment opportunity.
                                                </p>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} className="h-2" />
                                    </div>
                                </div>

                                {/* Input */}
                                <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 bg-[#f0f2f5] flex gap-2 shrink-0 items-end z-20">
                                    <div className="flex flex-col grow gap-2 relative">
                                        {replyingTo && (
                                            <div className="bg-slate-100 border-l-4 border-emerald-500 rounded-lg p-2 text-sm flex justify-between items-start mb-1 relative mx-2 mt-1">
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-emerald-600 font-semibold text-xs mb-0.5">{replyingTo.sender === 'me' ? 'You' : investorProfile?.full_name || 'Them'}</span>
                                                    <span className="truncate text-slate-600 text-xs">{replyingTo.text || 'File attachment'}</span>
                                                </div>
                                                <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 shrink-0 p-1 -mt-1 -mr-1"><X className="size-4" /></button>
                                            </div>
                                        )}
                                        {selectedFile && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs flex justify-between items-center w-max max-w-full shadow-sm ml-12">
                                                <span className="truncate mr-4 text-emerald-800">{selectedFile.name}</span>
                                                <button type="button" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="text-emerald-600 hover:text-red-500 shrink-0 font-bold p-1">X</button>
                                            </div>
                                        )}
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-14 left-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 flex flex-wrap max-w-[280px] gap-2">
                                                {COMMON_EMOJIS.map(emoji => (
                                                    <button key={emoji} type="button" onClick={() => { setInputMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="hover:bg-slate-100 p-1.5 rounded-lg text-xl transition-colors">
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-2xl px-2 py-1 shadow-sm">
                                            <button 
                                                type="button" 
                                                className="size-9 shrink-0 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors"
                                                title="Emojis"
                                                disabled={isUploading}
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            >
                                                <Smile className="size-6" />
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="size-9 shrink-0 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors"
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
                                                placeholder="Type a message"
                                                className="grow bg-transparent px-2 py-2.5 text-[15px] text-slate-800 placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                                                value={inputMessage}
                                                onChange={e => setInputMessage(e.target.value)}
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>
                                    <div className="pb-1 shrink-0">
                                        <button type="submit" disabled={(!inputMessage.trim() && !selectedFile) || isUploading}
                                            className="size-11 bg-[#00a884] hover:bg-[#008f6f] disabled:bg-slate-300 disabled:text-white disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all shadow-sm">
                                            {isUploading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 ml-1" />}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* ── TRUST BUILDING ── */}
                        {activeTab === 'trust' && currentPhase >= 2 && (
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
                                                    if (!m.link) { toast.warning("Invalid Meeting URL."); return; }
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
                        {activeTab === 'trust' && currentPhase < 2 && <PhaseLock phase={2} />}

                        {/* ── DUE DILIGENCE ── */}
                        {activeTab === 'diligence' && currentPhase >= 3 && (
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
                        {activeTab === 'diligence' && currentPhase < 3 && <PhaseLock phase={3} />}

                        {/* ── NEGOTIATION ── */}
                        {activeTab === 'negotiation' && currentPhase >= 4 && dealId && (
                            <NegotiationTab 
                                dealId={dealId} 
                                isStartup={currentUserId === startupId}
                                startupName={startupName}
                                investorName={investorProfile?.full_name || "Investor"}
                                onLock={() => advancePhase()} 
                            />
                        )}
                        {activeTab === 'negotiation' && currentPhase < 4 && <PhaseLock phase={4} />}

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

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                    />
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="size-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 font-outfit">Delete for Everyone?</h3>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                {messages.filter(m => selectedMessageIds.includes(m.id)).some(m => m.file) ? 
                                    "This action will permanently delete the selected messages and their attachments for both participants. This action cannot be undone." : 
                                    "This action will permanently delete the selected messages for both participants. This action cannot be undone."}
                            </p>
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        await handleDeleteMessages('everyone');
                                        setShowDeleteConfirm(false);
                                    }}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-red-400 shadow-sm shadow-red-600/20"
                                >
                                    {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showInvestorModal && investorId && (
                <InvestorProfileModal investorId={investorId} onClose={() => setShowInvestorModal(false)} />
            )}
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
