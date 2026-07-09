import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// This would typically be triggered by a Cron Job, Webhook, or Admin Interface
// when actual financial data matches the time horizon predicted by the AI.
/**
* Verifies pending AI predictions for a startup and metric against an actual value, then updates their status.
* @example
* POST(req)
* { success: true, message: 'Processed 3 predictions.', stats: { verified: 2, failed: 1 } }
* @param {NextRequest} req - The incoming request containing startupId, metric, and actualValue in the JSON body.
* @returns {Promise<NextResponse>} A JSON response indicating verification results or an error status.
**/
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { startupId, metric, actualValue } = body;

        if (!startupId || !metric || actualValue === undefined) {
            return NextResponse.json(
                { success: false, error: 'startupId, metric, and actualValue are required' },
                { status: 400 }
            );
        }

        // Find pending predictions for this startup and metric
        const { data: predictions, error: fetchError } = await supabase
            .from("ai_predictions")
            .select("*")
            .eq("startup_id", startupId)
            .eq("predicted_metric", metric)
            .eq("status", "pending");

        if (fetchError) throw fetchError;

        if (!predictions || predictions.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending predictions found to verify.' }, { status: 200 });
        }

        const stats = { verified: 0, failed: 0 };

        // Simple verification logic — runs all saves in parallel
        const results = await Promise.all(
            predictions.map(async (pred: any) => {
                const predictedValue = Number(pred.predicted_value);
                let isAccurate = false;
                
                if (pred.predicted_metric === 'healthScore') {
                    // If actual health is within 10 points of predicted
                    isAccurate = Math.abs(predictedValue - actualValue) <= 10;
                } else if (pred.predicted_metric === 'runwayMonths') {
                    // If actual runway was within 2 months of predicted
                    isAccurate = Math.abs(predictedValue - actualValue) <= 2;
                } else if (pred.predicted_metric === 'burnRate') {
                    // Within 15% margin of error
                    isAccurate = Math.abs(predictedValue - actualValue) <= (actualValue * 0.15);
                } else {
                    isAccurate = predictedValue === actualValue; // Exact match fallback
                }

                const status = isAccurate ? 'verified' : 'failed';

                const { error: updateError } = await supabase
                    .from("ai_predictions")
                    .update({
                        actual_value: actualValue,
                        verification_date: new Date().toISOString(),
                        status
                    })
                    .eq("id", pred.id);

                if (updateError) throw updateError;
                return isAccurate;
            })
        );

        results.forEach((isAccurate) => {
            if (isAccurate) stats.verified += 1;
            else stats.failed += 1;
        });

        return NextResponse.json({
            success: true,
            message: `Processed ${predictions.length} predictions.`,
            stats
        }, { status: 200 });
    } catch (err: any) {
        console.error("AI Prediction Verification Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
