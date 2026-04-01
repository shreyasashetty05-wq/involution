import mongoose, { Schema, Document } from 'mongoose';

export interface IKYCDocument extends Document {
    email: string; // Used to identify the creator
    name: string;
    type: string; // "Startup Founder" | "Investor"
    aadhaar: string; // Masked or unmasked Aadhaar number
    pan: string;
    aadhaarFile: string; // Base64 Data URI
    panFile: string; // Base64 Data URI
    status: 'Pending' | 'Approved' | 'Rejected';
    matchScore: number;
}

const KYCSchema: Schema = new Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true, default: "Startup Founder" },
    aadhaar: { type: String, required: true },
    pan: { type: String, required: true },
    aadhaarFile: { type: String, required: true }, // Store binary image as base64 payload
    panFile: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    matchScore: { type: Number, default: 0 }
}, {
    timestamps: true
});

export default mongoose.models.KYCDocument || mongoose.model<IKYCDocument>('KYCDocument', KYCSchema);
