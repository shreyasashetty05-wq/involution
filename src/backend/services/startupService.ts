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
    const targetRev = Number(body.mrr);
    const profitMargin = Number(body.netProfitMargin) / 100;
    const targetProfit = targetRev * profitMargin;

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
        name: body.name,
        owner_email: ownerEmail,
        sector: body.sector,
        business_model: body.businessModel,
        desc: body.description,
        requested: Number(body.fundingRequired),
        equity: Number(body.equityForSale),
        revenue: targetRev,
        burn: targetRev - targetProfit,
        risk: "Medium",
        score: 80,
        is_student: body.isStudent || false,
        founder_age: Number(body.founderAge) || null,
        videos: body.videos.filter((v: string) => v.trim() !== "").map((url: string) => {
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
        basic_info: body.basicInfo || {},
        business_info: body.businessInfo || {},
        financials_monthly: body.financialsMonthly || {},
        financials_yearly: body.financialsYearly || {},
        investment_details: body.investmentDetails || {},
        growth_metrics: body.growthMetrics || {},
        operational_metrics: body.operationalMetrics || {},
        credibility: body.credibility || {},
        risk_disclosure: body.riskDisclosure || {},
        ai_ready: body.aiReady || {}
    };

    const { data, error } = await supabase
        .from("startups")
        .insert(newStartupData)
        .select()
        .single();

    if (error) throw error;
    
    // Add _id for backward compatibility with frontend keys
    return { ...data, _id: data.id };
};
