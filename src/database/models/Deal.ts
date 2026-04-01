import mongoose from 'mongoose';

const DealSchema = new mongoose.Schema({
    startupId: { type: String, required: true },
    startupName: { type: String, required: true },
    investorId: { type: String, required: true },
    status: { type: String, enum: ['negotiating', 'executed', 'cancelled'], default: 'negotiating' },

    // Financial Terms
    termAmount: { type: String, default: "₹ 50,00,000" },
    termEquity: { type: String, default: "10.0%" },
    paymentMethod: { type: String, default: "wire transfer" },
    investmentPeriod: { type: String, default: "5" },

    // Contractual Metadata
    companyAddress: { type: String, default: "" },
    investorAddress: { type: String, default: "" },
    executives: { type: String, default: "" },
    board: { type: String, default: "" },

    // Signatures
    startupSignature: { type: String, default: null },
    investorSignature: { type: String, default: null },

    // Deal Lifecycle
    currentPhase: { type: Number, default: 1 }, // 1: Identity, 2: Pitch, 3: Meetings, 4: Diligence, 5: Agreement
    meetings: [{
        title: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        durationMinutes: { type: Number, default: 10 },
        meetLink: { type: String, required: true },
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
    }],

    // Chat History
    messages: [{
        senderId: { type: String, required: true },
        text: { type: String, required: true },
        time: { type: String, required: true }
    }],

}, { timestamps: true });

export const Deal = mongoose.models.Deal || mongoose.model('Deal', DealSchema);
