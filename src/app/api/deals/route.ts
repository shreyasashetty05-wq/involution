import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { google } from "googleapis";

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
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = (session.user as any).id || session.user.email;
        const requestedInvestorId = req.nextUrl.searchParams.get('investorId');

        // Use provided investorId (if sender is startup), otherwise assume sender is the investor
        const investorId = requestedInvestorId || sessionUserId;
        const startupId = req.nextUrl.searchParams.get('startupId');

        if (!startupId) {
            return NextResponse.json({ success: false, error: 'startupId is required' }, { status: 400 });
        }

        const deal = await Deal.findOne({ investorId, startupId }).lean();

        return NextResponse.json({ success: true, deal, currentUser: sessionUserId });

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
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = (session.user as any).id || session.user.email;
        const { startupId, startupName, text, investorId: requestedInvestorId } = await req.json();

        // If the frontend passed an investorId, the sender is likely the startup. 
        // If not, the sender is the investor themselves.
        const investorId = requestedInvestorId || sessionUserId;

        if (!startupId || !startupName || !text) {
            return NextResponse.json({ success: false, error: 'startupId, startupName, and text are required' }, { status: 400 });
        }

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Find existing deal or create a new one
        let deal = await Deal.findOne({ investorId, startupId });

        if (deal) {
            // Append message
            deal.messages.push({
                senderId: sessionUserId, // Whoever is logged in is the sender
                text,
                time: timeString
            });
            await deal.save();
        } else {
            // Create new deal
            deal = await Deal.create({
                investorId,
                startupId,
                startupName,
                status: 'negotiating',
                currentPhase: 1, // Start at Phase 1 for new deals
                messages: [{
                    senderId: investorId,
                    text,
                    time: timeString
                }]
            });
        }

        return NextResponse.json({ success: true, deal });

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
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = (session.user as any).id || session.user.email;
        const body = await req.json();
        const { startupId, investorId: requestedInvestorId, action } = body;

        const investorId = requestedInvestorId || sessionUserId;

        if (!startupId) {
            return NextResponse.json({ success: false, error: 'startupId is required' }, { status: 400 });
        }

        let deal = await Deal.findOne({ investorId, startupId });
        if (!deal) {
            return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
        }

        if (action === 'advancePhase') {
            const { newPhase } = body;
            if (newPhase && newPhase > deal.currentPhase) {
                deal.currentPhase = newPhase;
            }
        } else if (action === 'execute') {
            deal.status = 'executed';
            deal.termAmount = body.termAmount;
            deal.termEquity = body.termEquity;
            deal.startupSignature = body.startupSignature;
            deal.investorSignature = body.investorSignature;
            deal.companyAddress = body.companyAddress;
            deal.investorAddress = body.investorAddress;
            deal.paymentMethod = body.paymentMethod;
            deal.investmentPeriod = body.investmentPeriod;
            deal.executives = body.executives;
            deal.board = body.board;
        } else if (action === 'scheduleMeeting') {
            const { meeting } = body;
            
            let finalMeetLink = meeting.meetLink;

            try {
                const accessToken = (session.user as any).accessToken;
                if (!accessToken) {
                    return NextResponse.json({ success: false, error: 'User has no Google access token. Please re-login.' }, { status: 401 });
                }

                const oauth2Client = new google.auth.OAuth2();
                oauth2Client.setCredentials({ access_token: accessToken });
                
                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
                
                const startDateTime = new Date(`${meeting.date}T${meeting.time}:00`).toISOString();
                const endDateTime = new Date(new Date(startDateTime).getTime() + (meeting.durationMinutes || 10) * 60000).toISOString();

                const event = {
                    summary: meeting.title,
                    description: 'InVolution Trust Building Meeting',
                    start: {
                        dateTime: startDateTime,
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    },
                    end: {
                        dateTime: endDateTime,
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    },
                    conferenceData: {
                        createRequest: {
                            requestId: `inv-${Date.now()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet'
                            }
                        }
                    }
                };

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    conferenceDataVersion: 1,
                    requestBody: event,
                });

                if (response.data?.conferenceData?.entryPoints) {
                    const meetEntryPoint = response.data.conferenceData.entryPoints.find(
                        ep => ep.entryPointType === 'video'
                    );
                    if (meetEntryPoint && meetEntryPoint.uri) {
                        finalMeetLink = meetEntryPoint.uri;
                    }
                }

                if (!finalMeetLink) {
                    throw new Error("Google API did not return a meet link");
                }
            } catch (err: any) {
                console.error("Failed to generate Google Meet via Calendar API:", err.message);
                return NextResponse.json({ success: false, error: 'Failed to generate Google Meet link: ' + err.message }, { status: 500 });
            }

            deal.meetings.push({
                title: meeting.title,
                date: meeting.date,
                time: meeting.time,
                durationMinutes: meeting.durationMinutes || 10,
                meetLink: finalMeetLink,
                status: meeting.status || 'scheduled'
            });
        }

        await deal.save();

        return NextResponse.json({ success: true, deal });

    } catch (error: any) {
        console.error("Update Deal Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
