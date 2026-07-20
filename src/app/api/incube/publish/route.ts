import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Handles Incubation application submission.
 * @example
 * POST(req)
 * { success: true, data: applicationRecord }
 * @param {Request} req - Incoming request containing application data.
 * @returns {Promise<Response>} JSON response indicating success with the saved record or an error status.
 **/
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        const body = await req.json();

        // Ensure required fields are present
        const requiredFields = [
            'fullName', 'email', 'institutionName', 'educationLevel',
            'projectName', 'problemStatement', 'solutionDescription',
            'currentStage', 'equityOffered', 'askAmount'
        ];

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
            }
        }

        const applicationPayload = {
            owner_email: user.email,
            full_name: body.fullName,
            founder_photo_url: body.founderPhotoUrl || "",
            team_members: body.teamMembersData || [],
            short_bio: body.shortBio || "",
            email: body.email,
            phone_number: body.phoneNumber || "",
            institution_name: body.institutionName,
            education_level: body.educationLevel,
            project_name: body.projectName,
            problem_statement: body.problemStatement,
            solution_description: body.solutionDescription,
            current_stage: body.currentStage,
            equity_offered: Number(body.equityOffered),
            ask_amount: Number(body.askAmount),
            pitch_videos: body.pitchVideos || [],
            additional_notes: body.additionalNotes || "",
            status: 'pending'
        };

        const { data, error } = await supabase
            .from("incubation_applications")
            .insert(applicationPayload)
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            });
            return NextResponse.json({ 
                success: false, 
                error: 'Database error while saving application.', 
                supabaseError: error.message,
                supabaseCode: error.code
            }, { status: 500 });
        }

        // Notify Admins
        await supabase.from('notifications').insert({
            role: 'admin',
            type: 'incubation_submitted',
            title: "🎓 New Incubation Application",
            description: `New student application submitted by ${applicationPayload.full_name} for ${applicationPayload.project_name}.`,
            link: `/admin/incubation`
        });

        // Notify User
        await supabase.from('notifications').insert({
            user_email: user.email,
            type: 'incubation_submitted',
            title: "🎓 Application Submitted",
            description: "Your Incubation application has been successfully submitted and is under review.",
            link: `/incube/dashboard`
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        console.error("Incubation Form Failed:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
