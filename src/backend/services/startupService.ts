import { extractYoutubeId } from "@/backend/utils/youtube";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates and persists a new startup record from the provided payload in Supabase, calculating derived financial values and normalizing video links.
 * @example
 * sync(supabase, body, ownerEmail)
 * createdStartup
 * @param {SupabaseClient} supabase - Supabase client instance.
 * @param {any} body - Startup input payload containing company details, funding data, metrics, and media links.
 * @param {string} ownerEmail - Email address of the startup owner to associate with the record.
 * @returns {Promise<any>} A promise that resolves to the created startup record.
 **/
export const publishStartup = async (supabase: SupabaseClient, body: any, ownerEmail: string) => {
    const targetRev = Number(body.monthlyRevenue) || 0;
    const currentProfit = Number(body.monthlyProfitLoss) || 0;
    const profitMargin = targetRev > 0 ? (currentProfit / targetRev) : 0;

    // Generate a 12-month curve leading up to the target metrics
    const generatedMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const generatedRev = [];
    const generatedProfit = [];
    for (let i = 0; i < 12; i+=1) {
        const growthFactor = 1.05**(i - 11);
        generatedRev.push(targetRev * growthFactor);
        generatedProfit.push((targetRev * growthFactor) * profitMargin);
    }

    const newStartupData = {
        name: body.startupName || body.name || "Unnamed Startup",
        owner_email: ownerEmail,
        sector: body.industry || body.sector,
        business_model: body.businessModel,
        desc: body.startupDescription || body.description,
        requested: Number(body.investmentRequired || body.fundingRequired),
        equity: Number(body.equityOffered || body.equityForSale),
        revenue: targetRev,
        burn: Number(body.monthlyBurnRate) || 0,
        risk: "Medium",
        score: 80,
        is_student: body.isStudent || false,
        founder_age: Number(body.founderAge) || null,
        videos: (body.pitchVideos || body.videos || []).filter((v: string) => v.trim() !== "").map((url: string) => {
            const yId = extractYoutubeId(url);
            return {
                title: "Pitch Video",
                thumb: yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
                url: yId ? `https://www.youtube.com/embed/${yId}` : url
            }
        }),
        financials: {
            months: generatedMonths,
            revenue: generatedRev,
            netProfit: generatedProfit,
            roi: Number(body.projectedROI) || 0,
            cac: Number(body.cac) || 0,
            ltv: Number(body.ltv) || 0
        },
        basic_info: {
            logoUrl: body.logoUrl,
            startupName: body.startupName,
            startupTagline: body.startupTagline,
            founderName: body.founderName,
            founderAge: body.founderAge,
            founderRole: body.founderRole,
            founderPhotoUrl: body.founderPhotoUrl,
            founderLinkedin: body.founderLinkedin,
            teamMembersData: body.teamMembersData || []
        },
        business_info: {
            industry: body.industry,
            companyType: body.companyType,
            startupStage: body.startupStage,
            yearFounded: body.yearFounded,
            headquarters: body.headquarters,
            website: body.website,
            businessModel: body.businessModel,
            revenueModel: body.revenueModel,
            targetMarket: body.targetMarket,
            problemStatement: body.problemStatement,
            solution: body.solution,
            uvp: body.uvp,
            competitors: body.competitors,
            startupDescription: body.startupDescription
        },
        financials_monthly: {
            monthlyRevenue: body.monthlyRevenue,
            monthlyExpenses: body.monthlyExpenses,
            monthlyProfitLoss: body.monthlyProfitLoss,
            cashInBank: body.cashInBank,
            monthlyBurnRate: body.monthlyBurnRate,
            runway: body.runway
        },
        investment_details: {
            investmentRequired: body.investmentRequired,
            equityOffered: body.equityOffered,
            currentValuation: body.currentValuation,
            useOfFunds: body.useOfFunds || {}
        },
        growth_metrics: {
            totalCustomers: body.totalCustomers,
            monthlyActiveUsers: body.monthlyActiveUsers,
            monthlyGrowth: body.monthlyGrowth,
            customerRetention: body.customerRetention,
            repeatCustomers: body.repeatCustomers
        },
        credibility: {
            verification: body.verification || {}
        },
        risk_disclosure: {
            pendingLegalCases: body.pendingLegalCases,
            outstandingLoans: body.outstandingLoans,
            previousFundingRaised: body.previousFundingRaised,
            fundingAmount: body.fundingAmount,
            investorName: body.investorName,
            fundingRound: body.fundingRound
        },
        payment_method: body.paymentMethod,
        upi_id: body.upiId,
        account_holder_name: body.accountHolderName,
        bank_name: body.bankName,
        account_number: body.accountNumber,
        ifsc_code: body.ifscCode
    };

    const { data: existingStartup } = await supabase
        .from("startups")
        .select("id")
        .eq("owner_email", ownerEmail)
        .maybeSingle();

    let data, error;

    if (existingStartup) {
        const response = await supabase
            .from("startups")
            .update(newStartupData)
            .eq("id", existingStartup.id)
            .select()
            .single();
        data = response.data;
        error = response.error;
    } else {
        const response = await supabase
            .from("startups")
            .insert(newStartupData)
            .select()
            .single();
        data = response.data;
        error = response.error;
    }

    if (error) throw error;
    
    // Add _id for backward compatibility with frontend keys
    return { ...data, _id: data.id };
};
