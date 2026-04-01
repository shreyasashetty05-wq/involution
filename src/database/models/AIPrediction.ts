import mongoose, { Schema, Document } from 'mongoose';

export interface IAIPrediction extends Document {
    startupId: mongoose.Types.ObjectId | string;
    predictionDate: Date;
    predictedMetric: 'healthScore' | 'runwayMonths' | 'burnRate';
    predictedValue: number;
    actualValue?: number;
    verificationDate?: Date;
    status: 'pending' | 'verified' | 'failed';
    confidenceScore?: number;
}

const AIPredictionSchema: Schema = new Schema({
    startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
    predictionDate: { type: Date, default: Date.now },
    predictedMetric: {
        type: String,
        enum: ['healthScore', 'runwayMonths', 'burnRate'],
        required: true
    },
    predictedValue: { type: Number, required: true },
    actualValue: { type: Number, required: false },
    verificationDate: { type: Date, required: false },
    status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    confidenceScore: { type: Number, required: false }
}, {
    timestamps: true
});

export default mongoose.models.AIPrediction || mongoose.model<IAIPrediction>('AIPrediction', AIPredictionSchema);
