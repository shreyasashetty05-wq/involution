import mongoose, { Schema, Document } from 'mongoose';

export interface IAIFeedback extends Document {
    startupId: mongoose.Types.ObjectId | string;
    investorEmail?: string;
    module: 'chat' | 'health' | 'due-diligence' | 'compliance' | 'trust';
    context?: string;
    aiResponse: string;
    feedbackType: 'upvote' | 'downvote';
    correction?: string;
    embedding?: number[];
    createdAt: Date;
    updatedAt: Date;
}

const AIFeedbackSchema: Schema = new Schema({
    startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
    investorEmail: { type: String, required: false },
    module: {
        type: String,
        enum: ['chat', 'health', 'due-diligence', 'compliance', 'trust'],
        required: true
    },
    context: { type: String, required: false },
    aiResponse: { type: String, required: true },
    feedbackType: { type: String, enum: ['upvote', 'downvote'], required: true },
    correction: { type: String, required: false },
    embedding: { type: [Number], required: false }
}, {
    timestamps: true
});

export default mongoose.models.AIFeedback || mongoose.model<IAIFeedback>('AIFeedback', AIFeedbackSchema);
