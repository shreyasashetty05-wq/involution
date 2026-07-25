"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Video, Calendar, Clock, PlayCircle, AlertTriangle,
    X, Loader2, ChevronRight, Timer, CalendarCheck, RefreshCw,
    XCircle, CheckCircle2, Info
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface Meeting {
    id: string;
    title: string;
    date: string;       // YYYY-MM-DD
    time: string;       // HH:MM (24h)
    durationMinutes: number;
    link: string;
    status: string;     // scheduled | live | completed | expired | cancelled
    startTime?: string; // ISO string
    endTime?: string;   // ISO string
    cancellationReason?: string;
    rescheduledAt?: string;
}

interface MeetingsTabProps {
    meetings: Meeting[];
    setMeetings: React.Dispatch<React.SetStateAction<any[]>>;
    startupId: string | null;
    investorId: string | null;
    startupName: string;
    currentUserId: string | null;
    dealId: string | null;
    fetchMessages: () => Promise<void>;
    toast: {
        success: (msg: string) => void;
        error: (msg: string) => void;
        warning: (msg: string) => void;
        info: (msg: string) => void;
    };
}

/* ─── Helpers ───────────────────────────────────────────── */
const MEETING_TYPES = [
    "Intro Meeting",
    "Product Demo",
    "Technical Discussion",
    "Due Diligence",
    "Investment Discussion",
    "Final Negotiation",
];

const CANCEL_REASONS = [
    "Founder unavailable",
    "Investor unavailable",
    "Emergency",
    "Other",
];

function getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDefaultTime(): string {
    const d = new Date(Date.now() + 60 * 1000); // 1 minute ahead
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return dateStr; }
}

function formatTime12(time24: string): string {
    try {
        const [h, m] = time24.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    } catch { return time24; }
}

function getMeetingStart(m: Meeting): Date {
    if (m.startTime) return new Date(m.startTime);
    return new Date(`${m.date}T${m.time}:00`);
}

function getMeetingEnd(m: Meeting): Date {
    if (m.endTime) return new Date(m.endTime);
    const start = getMeetingStart(m);
    return new Date(start.getTime() + (m.durationMinutes || 20) * 60 * 1000);
}

function computeLiveStatus(m: Meeting): string {
    if (m.status === "cancelled") return "cancelled";
    if (m.status === "completed") return "completed";
    const now = new Date();
    const start = getMeetingStart(m);
    const end = getMeetingEnd(m);
    if (now >= end) return "expired";
    if (now >= start) return "live";
    return "upcoming";
}

function formatCountdown(diffMs: number): string {
    if (diffMs <= 0) return "0s";
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (days === 0 && secs >= 0) parts.push(`${secs}s`);
    return parts.join(" ") || "0s";
}

function formatRemaining(diffMs: number): string {
    if (diffMs <= 0) return "00:00";
    const totalSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/* ─── Component ─────────────────────────────────────────── */
export default function MeetingsTab({
    meetings, setMeetings, startupId, investorId, startupName,
    currentUserId, dealId, fetchMessages, toast
}: MeetingsTabProps) {

    // ── Scheduling form state
    const [meetingType, setMeetingType] = useState("Intro Meeting");
    const [meetingDate, setMeetingDate] = useState(getTodayStr());
    const [meetingTime, setMeetingTime] = useState(getDefaultTime());
    const [isScheduling, setIsScheduling] = useState(false);

    // ── Cancel dialog
    const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
    const [customCancelReason, setCustomCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    // ── Reschedule dialog
    const [rescheduleMeetingId, setRescheduleMeetingId] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [isRescheduling, setIsRescheduling] = useState(false);

    // ── View all meetings
    const [showAllMeetings, setShowAllMeetings] = useState(false);

    // ── Real-time countdown ticker
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Auto-status transition (every tick)
    const statusSyncRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!meetings || meetings.length === 0) return;
        meetings.forEach(m => {
            const liveStatus = computeLiveStatus(m);
            if (liveStatus !== m.status && !statusSyncRef.current.has(m.id)) {
                // Only sync transitions: scheduled→live, scheduled→expired, live→expired
                if (
                    (m.status === "scheduled" && (liveStatus === "live" || liveStatus === "expired")) ||
                    (m.status === "live" && (liveStatus === "expired" || liveStatus === "completed"))
                ) {
                    statusSyncRef.current.add(m.id);
                    // Persist to server. The UI already uses liveStatus via computeLiveStatus(m)
                    syncMeetingStatus(m.id, liveStatus === "expired" && m.status === "live" ? "completed" : liveStatus)
                        .catch(() => {
                            // Only remove from sync ref if failed, so we can retry.
                            statusSyncRef.current.delete(m.id);
                        });
                }
            }
        });
    }, [tick, meetings]);

    // ── API helpers
    const syncMeetingStatus = async (meetingId: string, newStatus: string) => {
        if (!startupId) return;
        try {
            await fetch("/api/deals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startupId, investorId,
                    action: "updateMeetingStatus",
                    meetingId, newStatus
                }),
            });
        } catch (err) {
            console.error("Failed to sync meeting status:", err);
        }
    };

    const scheduleMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meetingDate || !meetingTime || !startupId) return;

        // Client-side validation
        if (hasActiveMeeting) {
            toast.warning("You already have an active meeting. Please wait for it to end before scheduling another.");
            return;
        }

        const selectedStart = new Date(`${meetingDate}T${meetingTime}:00`);
        const now = new Date();
        if (selectedStart <= now) {
            toast.warning("Cannot schedule a meeting in the past. Please select a future time.");
            return;
        }

        setIsScheduling(true);
        try {
            const res = await fetch("/api/deals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startupId, investorId,
                    action: "scheduleMeeting",
                    meeting: {
                        title: meetingType,
                        date: meetingDate,
                        time: meetingTime,
                        startTime: selectedStart.toISOString(),
                        durationMinutes: 20,
                        status: "scheduled",
                    },
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                toast.error(errData.error || "Failed to schedule meeting.");
                return;
            }

            toast.success("Meeting scheduled successfully!");
            await fetchMessages();
            // Reset form with fresh defaults
            setMeetingDate(getTodayStr());
            setMeetingTime(getDefaultTime());
        } catch (err) {
            console.error("Failed to schedule meeting:", err);
            toast.error("Failed to schedule meeting. Please try again.");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleCancelMeeting = async () => {
        if (!cancelMeetingId || !startupId) return;
        const reason = cancelReason === "Other" ? customCancelReason.trim() || "Other" : cancelReason;
        if (!reason) {
            toast.warning("Please provide a cancellation reason.");
            return;
        }

        setIsCancelling(true);
        try {
            const res = await fetch("/api/deals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startupId, investorId,
                    action: "cancelMeeting",
                    meetingId: cancelMeetingId,
                    cancellationReason: reason,
                }),
            });
            if (!res.ok) {
                const errData = await res.json();
                toast.error(errData.error || "Failed to cancel meeting.");
                return;
            }
            toast.success("Meeting cancelled.");
            setCancelMeetingId(null);
            setCancelReason(CANCEL_REASONS[0]);
            setCustomCancelReason("");
            await fetchMessages();
        } catch (err) {
            toast.error("Failed to cancel meeting.");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleMeetingId || !startupId || !rescheduleDate || !rescheduleTime) return;

        const newStart = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
        if (newStart <= new Date()) {
            toast.warning("Cannot reschedule to a past time.");
            return;
        }

        setIsRescheduling(true);
        try {
            const res = await fetch("/api/deals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startupId, investorId,
                    action: "rescheduleMeeting",
                    meetingId: rescheduleMeetingId,
                    newDate: rescheduleDate,
                    newTime: rescheduleTime,
                }),
            });
            if (!res.ok) {
                const errData = await res.json();
                toast.error(errData.error || "Failed to reschedule meeting.");
                return;
            }
            toast.success("Meeting rescheduled successfully!");
            setRescheduleMeetingId(null);
            await fetchMessages();
        } catch (err) {
            toast.error("Failed to reschedule meeting.");
        } finally {
            setIsRescheduling(false);
        }
    };

    const handleJoin = (m: Meeting) => {
        const status = computeLiveStatus(m);
        if (status === "expired" || status === "completed") {
            toast.warning("This meeting has expired.");
            return;
        }
        if (status === "upcoming") {
            // Allow join 30 seconds before
            const start = getMeetingStart(m);
            const fiveMinBefore = new Date(start.getTime() - 30 * 1000);
            if (new Date() < fiveMinBefore) {
                toast.info("You can join 30 seconds before the meeting.");
                return;
            }
        }
        if (!m.link) {
            toast.warning("Invalid meeting URL.");
            return;
        }
        window.open(m.link, "_blank");
    };

    // ── Compute display data for each meeting
    const now = new Date();
    const enrichedMeetings = meetings.map(m => {
        const liveStatus = computeLiveStatus(m);
        const start = getMeetingStart(m);
        const end = getMeetingEnd(m);
        const diffToStart = start.getTime() - now.getTime();
        const diffToEnd = end.getTime() - now.getTime();
        const canJoin = liveStatus === "live" || (liveStatus === "upcoming" && diffToStart <= 30 * 1000);
        return { ...m, liveStatus, start, end, diffToStart, diffToEnd, canJoin };
    });

    // Separate active vs completed/historical
    const activeMeetings = enrichedMeetings.filter(m => m.liveStatus === "upcoming" || m.liveStatus === "live");
    const historicalMeetings = enrichedMeetings.filter(m => m.liveStatus === "completed" || m.liveStatus === "expired" || m.liveStatus === "cancelled");
    const displayMeetings = showAllMeetings ? enrichedMeetings : [...activeMeetings, ...historicalMeetings.slice(0, 3)];

    const hasActiveMeeting = activeMeetings.length > 0;

    // Sort: live first, then upcoming (nearest first), then historical (newest first)
    displayMeetings.sort((a, b) => {
        const order: Record<string, number> = { live: 0, upcoming: 1, completed: 2, expired: 3, cancelled: 4 };
        const oa = order[a.liveStatus] ?? 5;
        const ob = order[b.liveStatus] ?? 5;
        if (oa !== ob) return oa - ob;
        if (a.liveStatus === "upcoming") return a.start.getTime() - b.start.getTime();
        return b.start.getTime() - a.start.getTime();
    });

    // ── Status badge helper
    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, { className: string; label: string }> = {
            upcoming: { className: "badge-upcoming", label: "Upcoming" },
            live: { className: "badge-live", label: "● Live" },
            completed: { className: "badge-completed", label: "Completed" },
            expired: { className: "badge-expired", label: "Expired" },
            cancelled: { className: "badge-cancelled", label: "Cancelled" },
        };
        const s = map[status] || map.expired;
        return <span className={s.className}>{s.label}</span>;
    };

    // ── Join button helper
    const JoinButton = ({ m }: { m: typeof displayMeetings[0] }) => {
        if (m.liveStatus === "cancelled") return null;
        if (m.liveStatus === "completed") {
            return (
                <button disabled className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-not-allowed">
                    View Summary
                </button>
            );
        }
        if (m.liveStatus === "expired") {
            return (
                <button disabled className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-not-allowed opacity-60">
                    Join
                </button>
            );
        }
        if (m.liveStatus === "live") {
            return (
                <button
                    onClick={() => handleJoin(m)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-sm shadow-emerald-600/20"
                >
                    <PlayCircle className="size-3.5" /> Join Now
                </button>
            );
        }
        // upcoming
        if (m.canJoin) {
            return (
                <button
                    onClick={() => handleJoin(m)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                    <PlayCircle className="size-3.5" /> Join Now
                </button>
            );
        }
        return (
            <button disabled className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-not-allowed">
                Join in {formatCountdown(m.diffToStart)}
            </button>
        );
    };

    return (
        <div className="p-6 flex flex-col lg:flex-row gap-8 overflow-y-auto">
            {/* ── LEFT: Schedule Form ── */}
            <div className="lg:w-[420px] shrink-0 space-y-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Video className="text-indigo-600 size-5" /> Trust Building Meetings
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Short, structured 20-minute Jitsi Meet sessions for mutual alignment.
                    </p>
                </div>

                <form onSubmit={scheduleMeeting} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <CalendarCheck className="size-4 text-indigo-500" />
                        Schedule a Meeting
                    </h3>

                    {/* Meeting Type */}
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Meeting Type</label>
                        <div className="relative mt-1.5">
                            <select
                                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none appearance-none cursor-pointer"
                                value={meetingType}
                                onChange={e => setMeetingType(e.target.value)}
                            >
                                {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date</label>
                            <div className="relative mt-1.5">
                                <input
                                    type="date"
                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                    value={meetingDate}
                                    min={getTodayStr()}
                                    onChange={e => setMeetingDate(e.target.value)}
                                    required
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Time</label>
                            <div className="relative mt-1.5">
                                <input
                                    type="time"
                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                    value={meetingTime}
                                    onChange={e => setMeetingTime(e.target.value)}
                                    required
                                />
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Duration info */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex gap-3 items-start">
                        <Info className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs text-indigo-800 font-semibold">Duration: 20 minutes</p>
                            <p className="text-xs text-indigo-600/80 mt-0.5">You can join the meeting 30 seconds before the scheduled time.</p>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isScheduling || hasActiveMeeting}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
                        title={hasActiveMeeting ? "You already have an active meeting scheduled." : ""}
                    >
                        {isScheduling ? (
                            <><Loader2 className="size-4 animate-spin" /> Scheduling...</>
                        ) : hasActiveMeeting ? (
                            <><AlertTriangle className="size-4" /> Active Meeting Exists</>
                        ) : (
                            <><CalendarCheck className="size-4" /> Schedule Meeting</>
                        )}
                    </button>
                </form>
            </div>

            {/* ── RIGHT: Scheduled Sessions ── */}
            <div className="flex-1 space-y-3 min-w-0">
                <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-3">
                    Scheduled Sessions
                </h3>

                {displayMeetings.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                        <Calendar className="size-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 font-medium">No meetings scheduled yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Use the form to schedule your first trust building session.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayMeetings.map(m => (
                            <div key={m.id} className="meeting-card">
                                {/* Top row: title + badge */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`size-2.5 rounded-full shrink-0 ${
                                            m.liveStatus === "live" ? "bg-red-500 live-dot" :
                                            m.liveStatus === "upcoming" ? "bg-emerald-500" :
                                            m.liveStatus === "completed" ? "bg-slate-400" :
                                            m.liveStatus === "cancelled" ? "bg-red-400" :
                                            "bg-slate-300"
                                        }`} />
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{m.title}</h4>
                                    </div>
                                    <StatusBadge status={m.liveStatus} />
                                </div>

                                {/* Info row */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-3" /> {formatDate(m.date)}
                                    </span>
                                    <span>•</span>
                                    <span>{formatTime12(m.time)}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3" /> 20 min
                                    </span>
                                </div>

                                {/* Status-specific info */}
                                {m.liveStatus === "upcoming" && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                                        <Timer className="size-3" /> Starts in {formatCountdown(m.diffToStart)}
                                    </p>
                                )}
                                {m.liveStatus === "live" && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-red-500 live-dot" />
                                        <span className="text-xs font-semibold text-red-700">
                                            Time Remaining: {formatRemaining(m.diffToEnd)}
                                        </span>
                                    </div>
                                )}
                                {m.liveStatus === "completed" && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                                        <CheckCircle2 className="size-3" />
                                        Ended {formatDate(m.date)} • {formatTime12(m.time)} + 20 min
                                    </p>
                                )}
                                {m.liveStatus === "expired" && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                                        <Clock className="size-3" />
                                        Expired {formatDate(m.date)} • {(() => {
                                            const end = getMeetingEnd(m);
                                            return `${String(end.getHours() % 12 || 12).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')} ${end.getHours() >= 12 ? 'PM' : 'AM'}`;
                                        })()}
                                    </p>
                                )}
                                {m.liveStatus === "cancelled" && m.cancellationReason && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mb-3">
                                        <XCircle className="size-3" /> Reason: {m.cancellationReason}
                                    </p>
                                )}

                                {/* Actions row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {m.liveStatus === "upcoming" && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setRescheduleMeetingId(m.id);
                                                    setRescheduleDate(m.date);
                                                    setRescheduleTime(m.time);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                            >
                                                <RefreshCw className="size-3" /> Reschedule
                                            </button>
                                            <button
                                                onClick={() => setCancelMeetingId(m.id)}
                                                className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                            >
                                                <X className="size-3" /> Cancel
                                            </button>
                                        </>
                                    )}
                                    <JoinButton m={m} />
                                </div>
                            </div>
                        ))}

                        {/* View All Meetings link */}
                        {historicalMeetings.length > 3 && !showAllMeetings && (
                            <button
                                onClick={() => setShowAllMeetings(true)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5 mt-2 transition-colors"
                            >
                                View All Meetings <ChevronRight className="size-4" />
                            </button>
                        )}
                        {showAllMeetings && (
                            <button
                                onClick={() => setShowAllMeetings(false)}
                                className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mt-2 transition-colors"
                            >
                                Show Less
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── CANCEL DIALOG ── */}
            {cancelMeetingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isCancelling && setCancelMeetingId(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="size-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Meeting?</h3>
                            <p className="text-sm text-slate-500 mb-4">This will cancel the meeting for both participants.</p>

                            <div className="w-full text-left space-y-3 mb-5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-red-400 outline-none"
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                >
                                    {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
                                </select>
                                {cancelReason === "Other" && (
                                    <input
                                        type="text"
                                        placeholder="Please specify..."
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-red-400 outline-none"
                                        value={customCancelReason}
                                        onChange={e => setCustomCancelReason(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setCancelMeetingId(null)}
                                    disabled={isCancelling}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    Keep Meeting
                                </button>
                                <button
                                    onClick={handleCancelMeeting}
                                    disabled={isCancelling || (cancelReason === "Other" && !customCancelReason.trim())}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-red-600/20"
                                >
                                    {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Cancel Meeting"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RESCHEDULE DIALOG ── */}
            {rescheduleMeetingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isRescheduling && setRescheduleMeetingId(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <RefreshCw className="size-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Reschedule Meeting</h3>
                                    <p className="text-xs text-slate-500">Choose a new date and time</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Date</label>
                                    <input
                                        type="date"
                                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        value={rescheduleDate}
                                        min={getTodayStr()}
                                        onChange={e => setRescheduleDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Time</label>
                                    <input
                                        type="time"
                                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        value={rescheduleTime}
                                        onChange={e => setRescheduleTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setRescheduleMeetingId(null)}
                                    disabled={isRescheduling}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReschedule}
                                    disabled={isRescheduling || !rescheduleDate || !rescheduleTime}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isRescheduling ? <Loader2 className="size-4 animate-spin" /> : "Reschedule"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
