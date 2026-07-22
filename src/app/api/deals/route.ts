import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

function mapDealToCamel(deal: any) {
    if (!deal) return null;
    return {
        _id: deal.id,
        id: deal.id,
        startupId: deal.startup_id,
        startupName: deal.startup_name,
        investorId: deal.investor_id,
        status: deal.status,
        termAmount: deal.term_amount,
        termEquity: deal.term_equity,
        paymentMethod: deal.payment_method,
        investmentPeriod: deal.investment_period,
        companyAddress: deal.company_address,
        investorAddress: deal.investor_address,
        executives: deal.executives,
        board: deal.board,
        startupSignature: deal.startup_signature,
        investorSignature: deal.investor_signature,
        currentPhase: deal.current_phase,
        meetings: deal.meetings,
        messages: deal.messages,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
    };
}

/**
 * Fetches a deal for the authenticated user by startupId, optionally using a provided investorId.
 * @example
 * GET(req)
 * { success: true, deal, currentUser }
 * @param {NextRequest} req - The incoming Next.js request containing search parameters such as investorId and startupId.
 * @returns {Promise<NextResponse>} A JSON response containing the deal data, current user ID, or an error response.
 **/
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = user.email || user.id;
        const requestedInvestorId = req.nextUrl.searchParams.get('investorId');

        // Use provided investorId (if sender is startup), otherwise assume sender is the investor
        const investorId = requestedInvestorId || sessionUserId;
        const startupId = req.nextUrl.searchParams.get('startupId');

        if (!startupId) {
            return NextResponse.json({ success: false, error: 'startupId is required' }, { status: 400 });
        }

        const { data: deal, error } = await supabase
            .from("deals")
            .select("*")
            .eq("investor_id", investorId)
            .eq("startup_id", startupId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (deal && deal.messages) {
            deal.messages = deal.messages.filter((msg: any) => {
                if (msg.deletedFor && msg.deletedFor.includes(sessionUserId)) return false;
                return true;
            });
        }

        return NextResponse.json({ success: true, deal: mapDealToCamel(deal), currentUser: sessionUserId });

    } catch (error: any) {
        console.error("Fetch Deal Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
* Saves a deal message for an authenticated user and creates the deal if it does not already exist.
* @example
* POST(req)
* { success: true, deal }
* @param {NextRequest} req - The incoming Next.js request containing startupId, startupName, text, and optional investorId.
* @returns {Promise<NextResponse>} A JSON response indicating success with the saved deal, or an error response if validation, authorization, or database operations fail.
**/
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = user.email || user.id;
        const { startupId, startupName, text, file, investorId: requestedInvestorId, id, replyTo } = await req.json();

        // If the frontend passed an investorId, the sender is likely the startup. 
        // If not, the sender is the investor themselves.
        const investorId = requestedInvestorId || sessionUserId;

        if (!startupId || !startupName || (!text && !file)) {
            return NextResponse.json({ success: false, error: 'startupId, startupName, and either text or file are required' }, { status: 400 });
        }

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Find existing deal or create a new one
        let { data: deal, error: fetchError } = await supabase
            .from("deals")
            .select("*")
            .eq("investor_id", investorId)
            .eq("startup_id", startupId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (deal) {
            // Append message
            const newMessage: any = {
                id: id || crypto.randomUUID(), // Save stable ID
                senderId: sessionUserId, // Whoever is logged in is the sender
                text: text || "",
                time: timeString,
                createdAt: new Date().toISOString()
            };
            if (file) {
                newMessage.file = file;
            }
            if (replyTo) {
                newMessage.replyTo = replyTo;
            }

            const updatedMessages = [...(deal.messages || []), newMessage];
            
            const { data: updatedDeal, error: updateError } = await supabase
                .from("deals")
                .update({ messages: updatedMessages })
                .eq("id", deal.id)
                .select()
                .single();
                
            if (updateError) throw updateError;
            deal = updatedDeal;
        } else {
            // Create new deal
            const newMessage: any = {
                id: id || crypto.randomUUID(), // Save stable ID
                senderId: investorId,
                text: text || "",
                time: timeString,
                createdAt: new Date().toISOString()
            };
            if (file) {
                newMessage.file = file;
            }
            if (replyTo) {
                newMessage.replyTo = replyTo;
            }

            const { data: newDeal, error: createError } = await supabase
                .from("deals")
                .insert({
                    investor_id: investorId,
                    startup_id: startupId,
                    startup_name: startupName,
                    status: 'negotiating',
                    current_phase: 1, // Start at Phase 1 for new deals
                    messages: [newMessage]
                })
                .select()
                .single();
                
            if (createError) throw createError;
            deal = newDeal;
        }

        return NextResponse.json({ success: true, deal: mapDealToCamel(deal) });

    } catch (error: any) {
        console.error("Save Deal Message Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * Updates a deal (advancing phase or executing the agreement).
 * @example
 * PUT(req)
 * { success: true, deal }
 * @param {NextRequest} req - The incoming Next.js request.
 * @returns {Promise<NextResponse>} JSON response indicating success or failure.
 */
export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = user.email || user.id;
        const body = await req.json();
        const { startupId, investorId: requestedInvestorId, action } = body;

        const investorId = requestedInvestorId || sessionUserId;

        if (!startupId) {
            return NextResponse.json({ success: false, error: 'startupId is required' }, { status: 400 });
        }

        let { data: deal, error: fetchError } = await supabase
            .from("deals")
            .select("*")
            .eq("investor_id", investorId)
            .eq("startup_id", startupId)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!deal) {
            return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
        }

        let updateData: any = {};

        if (action === 'advancePhase') {
            const { newPhase } = body;
            if (newPhase && newPhase > deal.current_phase) {
                updateData.current_phase = newPhase;
            }
        } else if (action === 'execute') {
            updateData.status = 'executed';
            updateData.term_amount = body.termAmount;
            updateData.term_equity = body.termEquity;
            updateData.startup_signature = body.startupSignature;
            updateData.investor_signature = body.investorSignature;
            updateData.company_address = body.companyAddress;
            updateData.investor_address = body.investorAddress;
            updateData.payment_method = body.paymentMethod;
            updateData.investment_period = body.investmentPeriod;
            updateData.executives = body.executives;
            updateData.board = body.board;
        } else if (action === 'scheduleMeeting') {
            const { meeting } = body;

            // Server-side validation: reject past dates/times
            const meetingStartStr = `${meeting.date}T${meeting.time}:00`;
            const meetingStart = new Date(meetingStartStr);
            const now = new Date();

            if (isNaN(meetingStart.getTime())) {
                return NextResponse.json({ success: false, error: 'Invalid date or time format' }, { status: 400 });
            }
            if (meetingStart <= now) {
                return NextResponse.json({ success: false, error: 'Cannot schedule a meeting in the past' }, { status: 400 });
            }
            
            // Jitsi meeting room URL link logic — unique per meeting
            const jitsiRoomId = `InVolution-Deal-${deal.id}-${Date.now()}`;
            const finalMeetLink = `https://meet.jit.si/${jitsiRoomId}`;
            const meetingId = crypto.randomUUID();

            // Compute end time (start + 20 minutes)
            const meetingEnd = new Date(meetingStart.getTime() + 20 * 60 * 1000);

            const updatedMeetings = [...(deal.meetings || []), {
                id: meetingId,
                _id: meetingId,
                title: meeting.title,
                date: meeting.date,
                time: meeting.time,
                durationMinutes: 20,
                meetLink: finalMeetLink,
                status: 'scheduled',
                scheduledAt: now.toISOString(),
                startTime: meetingStart.toISOString(),
                endTime: meetingEnd.toISOString()
            }];
            updateData.meetings = updatedMeetings;

            // Send notifications to both participants
            try {
                const notifBase = {
                    type: 'meeting',
                    title: 'Meeting Scheduled',
                    description: `${meeting.title} scheduled for ${meeting.date} at ${meeting.time} (20 min)`,
                    link: `/messages?startupId=${startupId}&investorId=${investorId}&tab=trust`
                };
                // Notify investor
                await supabase.from("notifications").insert({ ...notifBase, user_email: investorId });
                // Notify startup owner
                const { data: startupData } = await supabase.from("startups").select("owner_email").eq("id", startupId).maybeSingle();
                const startupEmail = startupData?.owner_email;
                if (!startupEmail) {
                    const { data: incubeData } = await supabase.from("incubation_applications").select("owner_email").eq("id", startupId).maybeSingle();
                    if (incubeData?.owner_email) {
                        await supabase.from("notifications").insert({ ...notifBase, user_email: incubeData.owner_email });
                    }
                } else {
                    await supabase.from("notifications").insert({ ...notifBase, user_email: startupEmail });
                }
            } catch (notifErr) {
                console.error("Meeting notification error (non-blocking):", notifErr);
            }
        } else if (action === 'rescheduleMeeting') {
            const { meetingId: reschMeetingId, newDate, newTime } = body;

            // Validate new date/time
            const newStartStr = `${newDate}T${newTime}:00`;
            const newStart = new Date(newStartStr);
            const now2 = new Date();

            if (isNaN(newStart.getTime())) {
                return NextResponse.json({ success: false, error: 'Invalid date or time format' }, { status: 400 });
            }
            if (newStart <= now2) {
                return NextResponse.json({ success: false, error: 'Cannot reschedule to a past time' }, { status: 400 });
            }

            const newEnd = new Date(newStart.getTime() + 20 * 60 * 1000);

            const updatedMeetings2 = (deal.meetings || []).map((m: any) => {
                if ((m.id === reschMeetingId || m._id === reschMeetingId) && m.status === 'scheduled') {
                    return {
                        ...m,
                        date: newDate,
                        time: newTime,
                        startTime: newStart.toISOString(),
                        endTime: newEnd.toISOString(),
                        rescheduledAt: now2.toISOString()
                    };
                }
                return m;
            });
            updateData.meetings = updatedMeetings2;

            // Send reschedule notifications
            try {
                const targetMeeting = (deal.meetings || []).find((m: any) => m.id === reschMeetingId || m._id === reschMeetingId);
                const notifBase = {
                    type: 'meeting',
                    title: 'Meeting Rescheduled',
                    description: `${targetMeeting?.title || 'Meeting'} rescheduled to ${newDate} at ${newTime}`,
                    link: `/messages?startupId=${startupId}&investorId=${investorId}&tab=trust`
                };
                await supabase.from("notifications").insert({ ...notifBase, user_email: investorId });
                const { data: startupData2 } = await supabase.from("startups").select("owner_email").eq("id", startupId).maybeSingle();
                const sEmail = startupData2?.owner_email;
                if (!sEmail) {
                    const { data: incubeData2 } = await supabase.from("incubation_applications").select("owner_email").eq("id", startupId).maybeSingle();
                    if (incubeData2?.owner_email) await supabase.from("notifications").insert({ ...notifBase, user_email: incubeData2.owner_email });
                } else {
                    await supabase.from("notifications").insert({ ...notifBase, user_email: sEmail });
                }
            } catch (notifErr) {
                console.error("Reschedule notification error (non-blocking):", notifErr);
            }
        } else if (action === 'cancelMeeting') {
            const { meetingId: cancelMeetingId, cancellationReason } = body;

            if (!cancellationReason) {
                return NextResponse.json({ success: false, error: 'Cancellation reason is required' }, { status: 400 });
            }

            const updatedMeetings3 = (deal.meetings || []).map((m: any) => {
                if ((m.id === cancelMeetingId || m._id === cancelMeetingId) && m.status === 'scheduled') {
                    return {
                        ...m,
                        status: 'cancelled',
                        cancellationReason,
                        cancelledAt: new Date().toISOString()
                    };
                }
                return m;
            });
            updateData.meetings = updatedMeetings3;

            // Send cancel notifications
            try {
                const cancelTarget = (deal.meetings || []).find((m: any) => m.id === cancelMeetingId || m._id === cancelMeetingId);
                const notifBase = {
                    type: 'meeting',
                    title: 'Meeting Cancelled',
                    description: `${cancelTarget?.title || 'Meeting'} has been cancelled. Reason: ${cancellationReason}`,
                    link: `/messages?startupId=${startupId}&investorId=${investorId}&tab=trust`
                };
                await supabase.from("notifications").insert({ ...notifBase, user_email: investorId });
                const { data: startupData3 } = await supabase.from("startups").select("owner_email").eq("id", startupId).maybeSingle();
                const sEmail3 = startupData3?.owner_email;
                if (!sEmail3) {
                    const { data: incubeData3 } = await supabase.from("incubation_applications").select("owner_email").eq("id", startupId).maybeSingle();
                    if (incubeData3?.owner_email) await supabase.from("notifications").insert({ ...notifBase, user_email: incubeData3.owner_email });
                } else {
                    await supabase.from("notifications").insert({ ...notifBase, user_email: sEmail3 });
                }
            } catch (notifErr) {
                console.error("Cancel notification error (non-blocking):", notifErr);
            }
        } else if (action === 'updateMeetingStatus') {
            const { meetingId: statusMeetingId, newStatus } = body;

            const validStatuses = ['scheduled', 'live', 'completed', 'expired'];
            if (!validStatuses.includes(newStatus)) {
                return NextResponse.json({ success: false, error: 'Invalid meeting status' }, { status: 400 });
            }

            const updatedMeetings4 = (deal.meetings || []).map((m: any) => {
                if (m.id === statusMeetingId || m._id === statusMeetingId) {
                    // Validate transitions
                    const current = m.status;
                    const allowed: Record<string, string[]> = {
                        'scheduled': ['live', 'expired', 'cancelled'],
                        'live': ['completed', 'expired'],
                    };
                    if (allowed[current]?.includes(newStatus)) {
                        return { ...m, status: newStatus };
                    }
                }
                return m;
            });
            updateData.meetings = updatedMeetings4;

            // Send start/end notifications
            try {
                const statusTarget = (deal.meetings || []).find((m: any) => m.id === statusMeetingId || m._id === statusMeetingId);
                if (newStatus === 'live') {
                    const notifBase = {
                        type: 'meeting',
                        title: 'Meeting Started',
                        description: `${statusTarget?.title || 'Meeting'} is now live! Join now.`,
                        link: `/messages?startupId=${startupId}&investorId=${investorId}&tab=trust`
                    };
                    await supabase.from("notifications").insert({ ...notifBase, user_email: investorId });
                    const { data: sd } = await supabase.from("startups").select("owner_email").eq("id", startupId).maybeSingle();
                    if (sd?.owner_email) await supabase.from("notifications").insert({ ...notifBase, user_email: sd.owner_email });
                } else if (newStatus === 'completed' || newStatus === 'expired') {
                    const notifBase = {
                        type: 'meeting',
                        title: 'Meeting Ended',
                        description: `${statusTarget?.title || 'Meeting'} has ended.`,
                        link: `/messages?startupId=${startupId}&investorId=${investorId}&tab=trust`
                    };
                    await supabase.from("notifications").insert({ ...notifBase, user_email: investorId });
                    const { data: sd } = await supabase.from("startups").select("owner_email").eq("id", startupId).maybeSingle();
                    if (sd?.owner_email) await supabase.from("notifications").insert({ ...notifBase, user_email: sd.owner_email });
                }
            } catch (notifErr) {
                console.error("Status notification error (non-blocking):", notifErr);
            }
        } else if (action === 'deleteMessages') {
            const { messageIds, mode } = body; // mode can be 'me' or 'everyone'
            
            if (!messageIds || !Array.isArray(messageIds) || !mode) {
                return NextResponse.json({ success: false, error: 'messageIds and mode are required' }, { status: 400 });
            }

            const updatedMessages = (deal.messages || []).map((msg: any) => {
                // Determine ID (either `id`, `_id` or the fallback stable ID used by frontend)
                const stableId = msg.id || msg._id || `msg_${msg.time}_${msg.senderId}_${(msg.text || '').substring(0, 15)}`;
                const idMatches = messageIds.includes(stableId);
                if (idMatches) {
                    if (mode === 'me') {
                        const deletedFor = msg.deletedFor || [];
                        if (!deletedFor.includes(sessionUserId)) {
                            deletedFor.push(sessionUserId);
                        }
                        return { ...msg, deletedFor };
                    } else if (mode === 'everyone') {
                        // Only the sender can delete for everyone
                        if (msg.senderId === sessionUserId) {
                            const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
                            const isWithinTime = (Date.now() - msgTime) < 15 * 60 * 1000;
                            if (!isWithinTime) {
                                // Optionally throw an error or just ignore. We'll ignore and not delete.
                                return msg;
                            }
                            return { 
                                ...msg, 
                                deletedForEveryone: true, 
                                isDeletedForEveryone: true, 
                                deletedAt: new Date().toISOString(),
                                text: "", 
                                file: null 
                            };
                        }
                    }
                }
                return msg;
            });
            updateData.messages = updatedMessages;
        }

        const { data: updatedDeal, error: updateError } = await supabase
            .from("deals")
            .update(updateData)
            .eq("id", deal.id)
            .select()
            .single();

        if (updateError) throw updateError;
        deal = updatedDeal;

        return NextResponse.json({ success: true, deal: mapDealToCamel(deal) });

    } catch (error: any) {
        console.error("Update Deal Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
