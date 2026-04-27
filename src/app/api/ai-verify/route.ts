import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import AIPrediction from "@/database/models/AIPrediction";

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
        await dbConnect();

        const body = await req.json();
        const { startupId, metric, actualValue } = body;

        if (!startupId || !metric || actualValue === undefined) {
            return NextResponse.json(
                { success: false, error: 'startupId, metric, and actualValue are required' },
                { status: 400 }
            );
        }

        // Find pending predictions for this startup and metric
        const predictions = await AIPrediction.find({
            startupId,
            predictedMetric: metric,
            status: 'pending'
        });

        if (predictions.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending predictions found to verify.' }, { status: 200 });
        }

        const stats = { verified: 0, failed: 0 };

        // Simple verification logic — runs all saves in parallel (no await-in-loop)
        const results = await Promise.all(
            predictions.map(async (pred) => {
                pred.actualValue = actualValue;
                pred.verificationDate = new Date();

                let isAccurate = false;
                if (pred.predictedMetric === 'healthScore') {
                    // If actual health is within 10 points of predicted
                    isAccurate = Math.abs(pred.predictedValue - actualValue) <= 10;
                } else if (pred.predictedMetric === 'runwayMonths') {
                    // If actual runway was within 2 months of predicted
                    isAccurate = Math.abs(pred.predictedValue - actualValue) <= 2;
                } else if (pred.predictedMetric === 'burnRate') {
                    // Within 15% margin of error
                    isAccurate = Math.abs(pred.predictedValue - actualValue) <= (actualValue * 0.15);
                } else {
                    isAccurate = pred.predictedValue === actualValue; // Exact match fallback
                }

                pred.status = isAccurate ? 'verified' : 'failed';
                await pred.save();
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
