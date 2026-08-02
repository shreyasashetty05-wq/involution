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
            'fullName', 'email', 'institutionName', 'educationType',
            'projectName', 'problemStatement', 'solutionDescription'
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
            city: body.city || "",
            state: body.state || "",
            linkedin_url: body.linkedinUrl || "",
            github_url: body.githubUrl || "",
            
            // Educational
            institution_name: body.institutionName,
            education_type: body.educationType || 'College Degree',
            education_level: body.educationType || 'College Degree',
            course: body.course || "",
            branch: body.branch || "",
            semester: body.semester || "",
            graduation_year: body.graduationYear || "",
            school_class: body.schoolClass || "",
            school_board: body.schoolBoard || "",
            diploma_course: body.diplomaCourse || "",
            diploma_branch: body.diplomaBranch || "",
            student_id_url: body.studentIdUrl || "",
            
            // Idea Details
            idea_logo_url: body.ideaLogoUrl || "",
            project_name: body.projectName,
            tagline: body.tagline || "",
            industry: body.industry || "",
            problem_statement: body.problemStatement,
            solution_description: body.solutionDescription,
            innovation_usp: body.innovationUsp || "",
            target_users: body.targetUsers || "",
            current_stage: body.currentStage,
            
            // Product Information
            prototype_available: body.prototypeAvailable || false,
            prototype_link: body.prototypeLink || "",
            github_repo: body.githubRepo || "",
            website: body.website || "",
            technology_used: body.technologyUsed || [],
            
            // Validation
            test_users_count: body.testUsersCount || "",
            pilot_testing: body.pilotTesting || "",
            mentor_feedback: body.mentorFeedback || "",
            hackathon_participation: body.hackathonParticipation || "",
            prototype_demo: body.prototypeDemo || "",
            other_validation: body.otherValidation || "",
            
            // Incubation Requirements
            support_needed: body.supportNeeded || [],
            funding_required: body.fundingRequired || false,
            equity_offered: body.equityOffered ? Number(body.equityOffered) : 0,
            ask_amount: body.askAmount ? Number(body.askAmount) : 0,
            fund_utilization: body.fundUtilization || [],
            
            // Media
            pitch_videos: body.pitchVideos || [],
            additional_notes: body.additionalNotes || "",
            
            // Payment Details
            payment_method: body.paymentMethod || null,
            upi_id: body.upiId || null,
            account_holder_name: body.accountHolderName || null,
            bank_name: body.bankName || null,
            account_number: body.accountNumber || null,
            ifsc_code: body.ifscCode || null,
            
            status: 'pending'
        };

        const { data: existingApp } = await supabase
            .from("incubation_applications")
            .select("id")
            .eq("owner_email", user.email)
            .maybeSingle();

        let data, error;

        if (existingApp) {
            const response = await supabase
                .from("incubation_applications")
                .update(applicationPayload)
                .eq("id", existingApp.id)
                .select()
                .single();
            data = response.data;
            error = response.error;
        } else {
            const response = await supabase
                .from("incubation_applications")
                .insert(applicationPayload)
                .select()
                .single();
            data = response.data;
            error = response.error;
        }

        if (body.deletedFiles && Array.isArray(body.deletedFiles) && body.deletedFiles.length > 0) {
            const pathsToRemove = body.deletedFiles.map((url: string) => {
                const parts = url.split('/incubation/');
                return parts.length > 1 ? parts[1] : null;
            }).filter((p: string | null) => p !== null);

            if (pathsToRemove.length > 0) {
                const { error: deleteError } = await supabase.storage.from('incubation').remove(pathsToRemove);
                if (deleteError) {
                    console.error("Failed to delete old files from storage:", deleteError);
                }
            }
        }

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
                error: `Database error: ${error.message} (Hint: ${error.hint || 'none'})`, 
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

        // Fire and forget AI Analysis trigger
        const host =
            req.headers.get("x-forwarded-host") ??
            req.headers.get("host") ??
            new URL(req.url).host;
        const proto =
            req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
        fetch(`${baseUrl}/api/ai-analyze`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': req.headers.get('cookie') || '' 
            },
            body: JSON.stringify({ type: 'incubation', incubationId: data.id }),
        }).catch(err => console.error("Failed to trigger initial AI Analysis:", err));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        console.error("Incubation Form Failed:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
